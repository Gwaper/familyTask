import { useState, type FormEvent } from 'react';
import { api } from './api.ts';
import { both, t } from './i18n.ts';

/** Saisie du code famille, une seule fois par appareil (cookie longue durée). */
export function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.login(code);
      await onSuccess();
    } catch {
      setWrong(true);
    }
  };

  return (
    <form className="login edit-form" onSubmit={submit}>
      <div className="login-icon" aria-hidden="true">🏠🔑</div>
      <label>
        {both(t.familyCode)}
        <input type="password" autoComplete="current-password" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      {wrong && <p className="hint">{both(t.wrongCode)}</p>}
      <button type="submit" className="primary login-button" disabled={!code.trim()}>{both(t.enter)}</button>
    </form>
  );
}
