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
- Tirage au sort : uniquement par le dé 🎲 de l'en-tête « À faire » du tableau (`POST /api/draw`), pas à la remise à zéro. Il remplace les attributions des tâches « À faire » (1 personne par rôle, équilibré : la moins chargée du rôle, égalités au hasard) ; l'attribution manuelle reste possible.
- Images : emojis uniquement dans l'interface (plus d'envoi de photos ; le serveur sert encore les photos déjà attribuées).
- Pas de réordonnancement dans l'interface (les routes `/order` existent mais ne sont plus appelées).
- Pas de saisie vocale (dictée essayée puis abandonnée) ; la lecture à voix haute 🔊 reste.
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
shared/draw.ts         tirage au sort équilibré (fonction pure, aussi utilisée pour l'animation du dé)
server/validate.ts     lecture des corps JSON
web/src/i18n.ts        TOUS les textes de l'interface ({ fr, es })
web/src/Bi.tsx         libellé bilingue des boutons (espagnol plus petit que le français)
web/src/icons.tsx      icônes dessinées en SVG (flèche, haut-parleur, coche, dé, crayon…)
web/src/ritual/        vue rituel (par défaut) ; postit.ts = couleur et inclinaison de chaque post-it
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
`avatar` / `icon` : un emoji (ou, pour d'anciennes données, `photo:<fichier>` d'une photo de `/data/kanban/photos`).
`color` : couleur vive choisie dans `MEMBER_COLORS`, affichée adoucie (`softColor`, mélange avec du blanc).

## API
- `GET /api/board` → `{ members, tasks }` (chaque tâche porte ses `memberIds`)
- `POST /api/tasks`, `PATCH /api/tasks/:id` (y compris `done`), `DELETE /api/tasks/:id`
- `PUT /api/tasks/:id/members` `{ memberIds }`
- `POST /api/members`, `PATCH /api/members/:id`, `DELETE /api/members/:id`
- `POST /api/reset` (remise à zéro manuelle), `POST /api/draw` (tirage au sort), `GET /photos/:file`, `GET /api/health`
- Inutilisées par l'interface : `PUT /api/tasks/order`, `PUT /api/members/order` `{ ids }`, `GET /api/photos`, `POST /api/photos` (multipart `file`, 5 Mo)
- `POST /api/login` `{ code }` (seulement si `FAMILY_CODE` est défini ; tout le reste de `/api` et `/photos` répond 401 sans cookie, sauf `/api/health`)

## Remise à zéro
`dueResetDate(now)` renvoie la date de la dernière échéance de `RESET_TIME` déjà passée.
Si `meta.last_reset` est plus ancien, les tâches récurrentes repassent à « À faire » ; leurs attributions
sont conservées et les tâches ponctuelles ne sont pas touchées. Vérification au démarrage (rattrapage) puis chaque minute.

## Règles UX
Zones tactiles ≥ 80 px, contrastes forts, aucun texte indispensable, rien de punitif (pas de rouge, de chrono, de score).
Aucune ressource externe : polices système, sons synthétisés (Web Audio), emojis natifs.

## Design
- Tableau en liège encadré de bois. Tâches = post-it carrés penchés avec un scotch ; couleur et inclinaison
  dérivées de l'id de la tâche (`postIt`), rien en base. Étiquettes de colonnes centrées (📌 / 🏆).
- Emojis des tâches délavés sur une tache blanche ; avatars en couleurs adoucies ; teints de peau proposés
  pour les avatars de personnes (sur Apple, 🏽 donne des cheveux châtains).
- Boutons doux en pastel (menthe = fini / ajouter, lavande = retour / modifier), icônes SVG à traits arrondis.
  Petits ronds visibles possibles, mais zone tactile de 80 px autour sur le tableau.
- Vue gestion : même liège, contenu sur une feuille crème scotchée ; pastilles colorées par catégorie
  (menthe = enfant seul, miel = enfant + adulte, pêche = adulte, bleu = tous les jours).

## Principes de code
KISS, DRY, jamais `any`, fonctions pures autant que possible (les effets de bord restent dans les handlers, les hooks et `index.ts`).
