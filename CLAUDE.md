# Kanban familial — notes projet

Tableau de tâches familial bilingue FR/ES, 2 colonnes (« À faire / Por hacer », « Fini ! / ¡Terminado! »),
utilisé chaque jour comme rituel sur un écran partagé, y compris par des enfants qui ne lisent pas.

## Décisions validées
- Appareils : tablette Android, iPad, TV, PC tactile → la flèche sur chaque carte est l'alternative au drag & drop.
- Remise à zéro quotidienne : `RESET_TIME=03:00`, fuseau `Europe/Paris`.
- Port : `PORT=8090` (Open WebUI utilise déjà un autre port).
- Serveur : Ubuntu 24.04 amd64. Données dans `/data/kanban` (`kanban.db` + `photos/`).
- `network_mode: host` dans docker-compose : Docker contourne UFW quand on publie un port, ce mode permet à la règle UFW limitée au réseau local de s'appliquer.
- En local sur Mac : `docker-compose.local.yml` publie simplement le port.
- Ne jamais lancer de commande qui modifie le serveur, le pare-feu ou les paquets : tout va dans le README.

## Stack
- TypeScript partout, exécuté directement par Node 24+ (suppression native des types : imports avec l'extension `.ts`, syntaxe effaçable uniquement, pas d'`enum`).
- Back : Hono + `@hono/node-server`. SQLite via `node:sqlite`, inclus dans Node (aucun module natif).
- Front : React + Vite + `@dnd-kit/core`. Pas de bibliothèque d'i18n, d'emojis, de confettis ni de PWA.
- Tests : vitest (`npm test`), base SQLite en mémoire.
- Un seul process : le serveur sert l'API, le front buildé (`dist/web`) et les photos.
- Synchro entre appareils par polling de `GET /api/board` toutes les 3 s, avec mise à jour optimiste côté front.

## Arborescence
```
shared/types.ts        types communs front/back
server/index.ts        démarrage (env, DB, rattrapage de la remise à zéro, minuterie, arrêt propre)
server/app.ts          routes Hono, fichiers statiques, /photos
server/db.ts           schéma, seed, requêtes
server/reset.ts        logique de remise à zéro (fonctions pures + application)
server/validate.ts     lecture des corps JSON
web/src/i18n.ts        TOUS les textes de l'interface ({ fr, es })
web/src/ritual/        vue rituel (par défaut)
web/src/manage/        vue gestion (#gestion)
```

## Schéma SQLite
```sql
members(id, name, color, avatar, position)
tasks(id, name_fr, name_es DEFAULT '', icon, done 0/1, recurring 0/1, position)
task_members(task_id → tasks CASCADE, member_id → members CASCADE, PK(task_id, member_id))
meta(key PK, value)   -- 'last_reset' = 'YYYY-MM-DD', 'seeded' = '1'
```
`avatar` / `icon` : un emoji, ou `photo:<fichier>` pour une photo de `/data/kanban/photos`.

## API
- `GET /api/board` → `{ members, tasks }` (chaque tâche porte ses `memberIds`)
- `POST /api/tasks`, `PATCH /api/tasks/:id` (y compris `done`), `DELETE /api/tasks/:id`
- `PUT /api/tasks/:id/members` `{ memberIds }`, `PUT /api/tasks/order` `{ ids }`
- `POST /api/members`, `PATCH /api/members/:id`, `DELETE /api/members/:id`, `PUT /api/members/order` `{ ids }`
- `POST /api/reset` (remise à zéro manuelle), `GET /api/photos`, `GET /photos/:file`, `GET /api/health`

## Remise à zéro
`dueResetDate(now)` renvoie la date de la dernière échéance de `RESET_TIME` déjà passée.
Si `meta.last_reset` est plus ancien, les tâches récurrentes repassent à « À faire » ; leurs attributions
sont conservées et les tâches ponctuelles ne sont pas touchées. Vérification au démarrage (rattrapage) puis chaque minute.

## Règles UX
Zones tactiles ≥ 80 px, contrastes forts, aucun texte indispensable, rien de punitif (pas de rouge, de chrono, de score).
Aucune ressource externe : polices système, sons synthétisés (Web Audio), emojis natifs.

## Principes de code
KISS, DRY, jamais `any`, fonctions pures autant que possible (les effets de bord restent dans les handlers, les hooks et `index.ts`).
