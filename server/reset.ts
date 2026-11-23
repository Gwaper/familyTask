import { getMeta, resetRecurringTasks, setMeta, transaction, type Db } from './db.ts';

export interface ResetConfig {
  /** Heure locale "HH:MM". */
  time: string;
  timeZone: string;
}

/** Date et heure locales d'un instant dans un fuseau : { date: "YYYY-MM-DD", time: "HH:MM" }. */
function localParts(now: Date, timeZone: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Date locale de la dernière échéance de remise à zéro déjà passée à l'instant `now`. */
export function dueResetDate(now: Date, config: ResetConfig): string {
  const { date, time } = localParts(now, config.timeZone);
  return time >= config.time ? date : previousDay(date);
}

/**
 * Applique la remise à zéro si la dernière a été manquée (rattrapage au démarrage compris).
 * Renvoie true si une remise à zéro a eu lieu.
 */
export function applyDueReset(db: Db, now: Date, config: ResetConfig): boolean {
  const due = dueResetDate(now, config);
  const last = getMeta(db, 'last_reset');
  if (last !== undefined && last >= due) return false;
  transaction(db, () => {
    resetRecurringTasks(db);
    setMeta(db, 'last_reset', due);
  });
  return true;
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
