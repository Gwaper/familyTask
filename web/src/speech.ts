import { useSyncExternalStore } from 'react';
import type { Bilingual } from './i18n.ts';

export interface VoiceLike {
  lang: string;
}

const normalize = (lang: string) => lang.replace('_', '-').toLowerCase();

/** Voix « xx-XX » de préférence (es-ES, fr-FR), sinon n'importe quelle variante de la langue. */
const findVoice = <V extends VoiceLike>(voices: V[], lang: 'es' | 'fr'): V | undefined =>
  voices.find((v) => normalize(v.lang) === `${lang}-${lang}`) ??
  voices.find((v) => normalize(v.lang).startsWith(lang));

/**
 * Choisit quoi lire : l'espagnol avec une voix espagnole, sinon le français
 * (pas de nom espagnol ou pas de voix espagnole). null si aucune voix n'est disponible.
 */
export function chooseSpeech<V extends VoiceLike>(
  text: Bilingual,
  voices: V[],
): { text: string; lang: string; voice?: V } | null {
  if (voices.length === 0) return null;
  const es = text.es ? findVoice(voices, 'es') : undefined;
  if (es) return { text: text.es, lang: es.lang, voice: es };
  const fr = findVoice(voices, 'fr');
  return { text: text.fr, lang: fr?.lang ?? 'fr-FR', voice: fr };
}

// ---------- navigateur ----------

const synth = typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis;
let voices: SpeechSynthesisVoice[] = synth?.getVoices() ?? [];
const listeners = new Set<() => void>();

function refreshVoices(): void {
  const list = synth?.getVoices() ?? [];
  if (list.length === voices.length) return;
  voices = list;
  listeners.forEach((notify) => notify());
}

// Les voix arrivent en différé (Chromium). On écoute dès le chargement du module, pour ne pas rater
// l'unique « voiceschanged », et on réinterroge quelques secondes pour les navigateurs qui ne l'émettent pas.
const VOICE_RETRY_MS = 500;
const VOICE_RETRIES = 20;
if (synth) {
  synth.addEventListener('voiceschanged', refreshVoices);
  let tries = 0;
  const timer = setInterval(() => {
    refreshVoices();
    if (voices.length > 0 || ++tries >= VOICE_RETRIES) clearInterval(timer);
  }, VOICE_RETRY_MS);
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  refreshVoices();
  return () => listeners.delete(onChange);
}

/** Référence gardée tant que la lecture dure : sinon Chromium peut la libérer avant de parler. */
let current: SpeechSynthesisUtterance | undefined;

/** Chromium ignore souvent un speak() appelé juste après cancel() : on laisse passer un court délai. */
const AFTER_CANCEL_MS = 120;

export function say(text: Bilingual): void {
  if (!synth) return;
  refreshVoices();
  const choice = chooseSpeech(text, voices);
  if (!choice) return;

  const utterance = new SpeechSynthesisUtterance(choice.text);
  utterance.lang = choice.lang;
  if (choice.voice) utterance.voice = choice.voice;
  utterance.rate = 0.9;
  utterance.onend = utterance.onerror = () => {
    if (current === utterance) current = undefined;
  };
  current = utterance;

  const speak = () => {
    synth.resume(); // Chromium reste parfois en pause après un passage en arrière-plan
    synth.speak(utterance);
  };
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(speak, AFTER_CANCEL_MS);
  } else {
    speak();
  }
}

/** true si l'appareil a au moins une voix (sinon on masque les haut-parleurs). */
export const useCanSpeak = (): boolean =>
  useSyncExternalStore(subscribe, () => voices.length > 0, () => false);

