# Kanban familial — notes projet

Tableau de tâches familial bilingue FR/ES, 2 colonnes (« À faire / Por hacer », « Fini ! / ¡Terminado! »),
utilisé chaque jour comme rituel sur un écran partagé, y compris par des enfants qui ne lisent pas.

## Décisions validées
- Appareils : tablette Android, iPad, TV, PC tactile → la flèche sur chaque carte est l'alternative au drag & drop.
- Remise à zéro quotidienne : `RESET_TIME=03:00`, fuseau `Europe/Paris`.
- Port : `PORT=8090` en local, `8080` dans l'image Docker (port attendu par Fly.io). Données dans `/data/kanban` (`kanban.db` + `photos/`).
- Hébergement : Fly.io (`fly.toml`, région `cdg`, volume `kanban_data`, machine arrêtée hors usage). Comparatif : `docs/hebergement.md`.
- Déploiement : `.github/workflows/deploy.yml` (tests sur chaque PR, tests + `flyctl deploy` sur chaque push sur `main`, secret `FLY_API_TOKEN`).
- Accès : `FAMILY_CODE` (secret Fly) ; `POST /api/login` pose un cookie HttpOnly (empreinte SHA-256 du code). Sans code : accès libre.
- Le conteneur démarre en root uniquement pour `chown` le volume, puis passe à `node` (`setpriv`).
- En local sur Mac : `docker-compose.yml` publie simplement le port.
- Tirage au sort : uniquement par le bouton 🎲 de la vue gestion (`POST /api/draw`), pas à la remise à zéro. Il remplace les attributions des tâches « À faire » (1 personne par rôle, équilibré : la moins chargée du rôle, égalités au hasard) ; l'attribution manuelle reste possible.
- Ne jamais lancer de commande qui modifie l'hébergement (fly, secrets GitHub) : tout va dans le README.

## Stack
- TypeScript partout, exécuté directement par Node 24+ (suppression native des types : imports avec l'extension `.ts`, syntaxe effaçable uniquement, pas d'`enum`).
- Back : Hono + `@hono/node-server`. SQLite via `node:sqlite`, inclus dans Node (aucun module natif).
- Front : React + Vite + `@dnd-kit/core`. Pas de bibliothèque d'i18n, d'emojis, de confettis ni de PWA (manifest et `sw.js` écrits à la main).
- Tests : vitest (`npm test`), base SQLite en mémoire.
- Un seul process : le serveur sert l'API, le front buildé (`dist/web`) et les photos.
- Synchro entre appareils par polling de `GET /api/board` toutes les 3 s, avec mise à jour optimiste côté front.

## Arborescence
```
shared/types.ts        types communs front/back
server/index.ts        démarrage (env, DB, rattrapage de la remise à zéro, minuterie, arrêt propre)
server/app.ts          routes Hono, fichiers statiques, /photos
server/auth.ts         code famille (cookie, middleware)
server/db.ts           schéma, seed, requêtes
server/reset.ts        logique de remise à zéro (fonctions pures + application)
server/draw.ts         tirage au sort équilibré (fonction pure)
server/validate.ts     lecture des corps JSON
web/src/i18n.ts        TOUS les textes de l'interface ({ fr, es })
web/src/ritual/        vue rituel (par défaut)
web/src/manage/        vue gestion (/gestion ou /manage)
```

## Schéma SQLite
```sql
members(id, name, color, avatar, role 'adult'|'child' DEFAULT 'adult', position)
tasks(id, name_fr, name_es DEFAULT '', icon, done 0/1, recurring 0/1, crew 'adult'|'child_adult'|'child' DEFAULT 'adult', position)
task_members(task_id → tasks CASCADE, member_id → members CASCADE, PK(task_id, member_id))
meta(key PK, value)   -- 'last_reset' = 'YYYY-MM-DD', 'seeded' = '1'
```
Colonnes ajoutées aux bases existantes au démarrage (`addColumnIfMissing`).
`avatar` / `icon` : un emoji, ou `photo:<fichier>` pour une photo de `/data/kanban/photos`.

## API
- `GET /api/board` → `{ members, tasks }` (chaque tâche porte ses `memberIds`)
- `POST /api/tasks`, `PATCH /api/tasks/:id` (y compris `done`), `DELETE /api/tasks/:id`
- `PUT /api/tasks/:id/members` `{ memberIds }`, `PUT /api/tasks/order` `{ ids }`
- `POST /api/members`, `PATCH /api/members/:id`, `DELETE /api/members/:id`, `PUT /api/members/order` `{ ids }`
- `POST /api/reset` (remise à zéro manuelle), `POST /api/draw` (tirage au sort), `GET /api/photos`, `POST /api/photos` (multipart `file`, 5 Mo), `GET /photos/:file`, `GET /api/health`
- `POST /api/login` `{ code }` (seulement si `FAMILY_CODE` est défini ; tout le reste de `/api` et `/photos` répond 401 sans cookie, sauf `/api/health`)

## Remise à zéro
`dueResetDate(now)` renvoie la date de la dernière échéance de `RESET_TIME` déjà passée.
Si `meta.last_reset` est plus ancien, les tâches récurrentes repassent à « À faire » ; leurs attributions
sont conservées et les tâches ponctuelles ne sont pas touchées. Vérification au démarrage (rattrapage) puis chaque minute.

## Règles UX
Zones tactiles ≥ 80 px, contrastes forts, aucun texte indispensable, rien de punitif (pas de rouge, de chrono, de score).
Aucune ressource externe : polices système, sons synthétisés (Web Audio), emojis natifs.

## Principes de code
KISS, DRY, jamais `any`, fonctions pures autant que possible (les effets de bord restent dans les handlers, les hooks et `index.ts`).
