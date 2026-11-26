import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { openDb } from './db.ts';
import { applyDueReset, isValidTime, type ResetConfig } from './reset.ts';

const port = Number(process.env.PORT ?? 8090);
const dataDir = process.env.DATA_DIR ?? './data/kanban';
const staticDir = process.env.STATIC_DIR ?? 'dist/web';
const reset: ResetConfig = {
  time: process.env.RESET_TIME ?? '03:00',
  timeZone: process.env.TZ ?? 'Europe/Paris',
};
if (!isValidTime(reset.time)) throw new Error(`RESET_TIME invalide : "${reset.time}" (attendu HH:MM)`);

const photosDir = join(dataDir, 'photos');
mkdirSync(photosDir, { recursive: true });
const db = openDb(join(dataDir, 'kanban.db'));

const checkReset = () => {
  if (applyDueReset(db, new Date(), reset)) console.log(`Remise à zéro des tâches récurrentes (${new Date().toISOString()})`);
};
checkReset(); // rattrapage si le serveur était éteint à l'heure prévue
const timer = setInterval(checkReset, 60_000);

const familyCode = process.env.FAMILY_CODE?.trim() || undefined;
const app = createApp({ db, photosDir, familyCode, staticDir: existsSync(staticDir) ? staticDir : undefined });
const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () =>
  console.log(`Kanban familial sur http://0.0.0.0:${port} (données : ${dataDir}, remise à zéro : ${reset.time} ${reset.timeZone})`),
);

const shutdown = () => {
  clearInterval(timer);
  server.close();
  db.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
