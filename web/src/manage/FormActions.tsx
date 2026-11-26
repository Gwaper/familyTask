import { CheckIcon } from '../icons.tsx';
import { Bi } from '../Bi.tsx';
import { t } from '../i18n.ts';

/** Boutons Annuler / Enregistrer communs aux formulaires. */
export function FormActions({ canSave, onCancel }: { canSave: boolean; onCancel: () => void }) {
  return (
    <div className="form-actions">
      <button type="button" className="pill-button pill-quiet" onClick={onCancel}><Bi text={t.cancel} /></button>
      <button type="submit" className="pill-button pill-add" disabled={!canSave}>
        <span className="pill-button-dot"><CheckIcon /></span>
        <Bi text={t.save} />
      </button>
    </div>
  );
}
