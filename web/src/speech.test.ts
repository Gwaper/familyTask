import { describe, expect, it } from 'vitest';
import { chooseSpeech } from './speech.ts';

const task = { fr: 'Ranger les jouets', es: 'Recoger los juguetes' };
const voices = (...langs: string[]) => langs.map((lang) => ({ lang }));

describe('chooseSpeech', () => {
  it('lit le nom espagnol avec une voix es-ES de préférence', () => {
    expect(chooseSpeech(task, voices('fr-FR', 'es-MX', 'es-ES'))).toMatchObject({ text: task.es, lang: 'es-ES' });
    expect(chooseSpeech(task, voices('es_US'))).toMatchObject({ text: task.es, lang: 'es_US' });
  });

  it('lit le français si aucune voix espagnole', () => {
    expect(chooseSpeech(task, voices('fr-FR', 'en-US'))).toMatchObject({ text: task.fr, lang: 'fr-FR' });
  });

  it('lit le français pour une tâche sans nom espagnol', () => {
    expect(chooseSpeech({ fr: 'Arroser', es: '' }, voices('es-ES', 'fr-FR'))).toMatchObject({ text: 'Arroser', lang: 'fr-FR' });
  });

  it('renvoie null sans aucune voix (icône masquée)', () => {
    expect(chooseSpeech(task, [])).toBeNull();
  });
});
