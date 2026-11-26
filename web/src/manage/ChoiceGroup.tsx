import { both, type Bilingual } from '../i18n.ts';
import type { Choice } from './roles.ts';

interface Props<K extends string> {
  title: Bilingual;
  choices: Record<K, Choice>;
  value: K;
  onChange: (value: K) => void;
}

/** Choix unique parmi quelques gros boutons (emoji + libellé bilingue). */
export function ChoiceGroup<K extends string>({ title, choices, value, onChange }: Props<K>) {
  return (
    <div>
      {both(title)}
      <div className="choices">
        {(Object.entries(choices) as [K, Choice][]).map(([key, { emoji, label }]) => (
          <button
            key={key}
            type="button"
            className={key === value ? 'choice selected' : 'choice'}
            aria-pressed={key === value}
            onClick={() => onChange(key)}
          >
            <span className="choice-emoji">{emoji}</span>
            {both(label)}
          </button>
        ))}
      </div>
    </div>
  );
}
