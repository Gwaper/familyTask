import type { Bilingual } from './i18n.ts';

/** Libellé bilingue : le français en premier, l'espagnol un peu plus petit (masqué s'il est vide ou identique). */
export function Bi({ text }: { text: Bilingual }) {
  return (
    <span className="bi">
      <span className="bi-fr">{text.fr}</span>
      {text.es && text.es !== text.fr && <span className="bi-es">{text.es}</span>}
    </span>
  );
}
