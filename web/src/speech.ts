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

function subscribe(onChange: () => void): () => void {
  if (!synth) return () => {};
  const update = () => {
    voices = synth.getVoices();
    onChange();
  };
  synth.addEventListener('voiceschanged', update);
  return () => synth.removeEventListener('voiceschanged', update);
}

export function say(text: Bilingual): void {
  const choice = chooseSpeech(text, voices);
  if (!synth || !choice) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(choice.text);
  utterance.lang = choice.lang;
  if (choice.voice) utterance.voice = choice.voice;
  utterance.rate = 0.9;
  synth.speak(utterance);
}

/** true si l'appareil a au moins une voix (sinon on masque les haut-parleurs). */
export const useCanSpeak = (): boolean =>
  useSyncExternalStore(subscribe, () => voices.length > 0, () => false);
