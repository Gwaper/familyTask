# Tâches de la famille / Tareas de la familia

Tableau de tâches familial à 2 colonnes, « À faire / Por hacer » et « Fini ! / ¡Terminado! ». Il sert de rituel quotidien
sur un écran partagé, et les enfants qui ne lisent pas peuvent l'utiliser : pictogrammes, avatars et lecture à voix haute en espagnol.

- **Vue rituel** (par défaut) :
  - un tap sur une carte choisit qui a fait la tâche ;
  - la carte se fait glisser vers « Fini ! », ou on appuie sur la grosse flèche ;
  - 🔊 lit le nom de la tâche en espagnol.
- **Vue gestion** (bouton ⚙️, ou `https://ADRESSE/gestion`) : tâches, membres, envoi de photos et remise à zéro manuelle.
- **Remise à zéro** : chaque jour à 03:00, les tâches récurrentes reviennent dans « À faire » avec les mêmes personnes attribuées.

Configuration (variables d'environnement) :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8090` | port HTTP |
| `RESET_TIME` | `03:00` | heure de la remise à zéro quotidienne (fuseau `Europe/Paris`) |
| `DATA_DIR` | `./data/kanban` (Docker : `/data/kanban`) | base SQLite `kanban.db` et dossier `photos/` |
| `FAMILY_CODE` | vide | code demandé une fois par appareil. Vide : accès libre (à réserver au développement) |

---

## 1. Développement en local

Prérequis : Node.js 24 ou plus récent.

```sh
npm install
npm run dev      # API sur :8090 + front Vite sur http://localhost:5173 (rechargement à chaud)
npm test         # tests de la logique métier
```

Les données de dev sont dans `./data/kanban` (ignoré par git).

## 2. Build et lancement sans Docker

```sh
npm run build    # vérification des types + front dans dist/web
npm start        # http://localhost:8090
```

## 3. Tester l'image Docker sur le Mac

Avec Docker Desktop lancé :

```sh
docker compose up -d --build                      # accès libre
FAMILY_CODE=soleil docker compose up -d --build   # avec le code famille
open http://localhost:8090
docker compose down
```

Les données sont rangées dans `./data/kanban`. Le cookie du code famille est marqué `Secure` : il fonctionne sur
`localhost` et en HTTPS, pas sur `http://IP-DU-MAC`.

---

## 4. Déploiement sur Fly.io

Pourquoi Fly.io : voir le [benchmark d'hébergement](docs/hebergement.md).

### 4.1 Une seule fois, depuis le Mac

Installer la CLI (`brew install flyctl`), puis :

```sh
fly auth signup                                    # ou fly auth login ; l'offre Free (5 $ d'usage/mois) suffit
fly launch --no-deploy --copy-config --name NOM-DE-L-APP --region cdg
fly volumes create kanban_data --region cdg --size 1
fly secrets set FAMILY_CODE='un-code-facile-a-retenir'
fly deploy --ha=false                              # premier déploiement (une seule machine : un seul volume)
```

`fly launch` met à jour la ligne `app =` de `fly.toml` avec le nom choisi : commite ce changement.
L'app répond sur `https://NOM-DE-L-APP.fly.dev`. Pour un domaine à toi : `fly certs add taches.example.com`.

### 4.2 Déploiement automatique (GitHub Actions)

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) :

- sur chaque pull request : `npm ci`, `npm run build` (vérification des types) et `npm test` ;
- sur chaque push sur `main` : les mêmes tests, puis `flyctl deploy --remote-only --ha=false` (l'image est construite chez Fly).

À configurer une fois :

```sh
fly tokens create deploy -x 999999h     # copie la valeur affichée
```

Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**, nom `FLY_API_TOKEN`,
valeur = le jeton. Le prochain push sur `main` déploie ; le lancement manuel est possible depuis l'onglet **Actions**
(*Run workflow*).

### 4.3 Fonctionnement

- La machine s'arrête quand aucun écran n'utilise l'app et redémarre en 1 à 2 s à la première requête.
  La remise à zéro manquée pendant l'arrêt est rattrapée au démarrage.
- Pour changer l'heure de remise à zéro : `RESET_TIME` dans la section `[env]` de `fly.toml`, puis push.
- Pour changer le code famille : `fly secrets set FAMILY_CODE='nouveau-code'` (chaque appareil le redemandera).
- Journal de l'app : `fly logs`.

---

## 5. Installer l'application sur les appareils (PWA)

Ouvre `https://NOM-DE-L-APP.fly.dev` sur l'appareil et saisis le code famille. Le code n'est demandé qu'une fois
par appareil (et une fois de plus dans l'app installée sur iPhone/iPad, qui ne partage pas les cookies de Safari).

### Téléphone ou tablette Android (Chrome)

Menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »). L'app s'ouvre en plein écran,
en portrait ou en paysage.

### iPhone / iPad (Safari)

Bouton Partager → **Sur l'écran d'accueil**. L'app s'ouvre sans barre Safari.

### PC avec écran tactile

Chrome ou Edge → icône d'installation dans la barre d'adresse, ou en mode kiosque :
`chrome --kiosk https://NOM-DE-L-APP.fly.dev`.

### TV

Ouvre l'adresse dans le navigateur de la TV et ajoute-la aux favoris. Sans écran tactile, utilise la grosse flèche
de chaque carte pour la déplacer. Le haut-parleur est masqué si la TV n'a pas de synthèse vocale.

### Téléphones (gestion)

Ouvre `https://NOM-DE-L-APP.fly.dev/gestion`. Une modification faite sur un téléphone apparaît sur l'écran partagé
en 3 secondes au plus.

---

## 6. Ajouter des photos

Dans la vue gestion, en modifiant une tâche ou un membre : **Image → Photos → 📷 Ajouter une photo**. Sur téléphone,
on peut prendre la photo directement. Formats `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, 5 Mo au plus.
Conseil : des images carrées.

---

## 7. Installer une voix espagnole

Le haut-parleur 🔊 lit le nom en **espagnol** avec une voix `es-ES` (sinon une autre voix espagnole).
Sans voix espagnole, il lit le nom en français. Sans aucune voix, l'icône est masquée.

### Android

1. **Paramètres → Système → Langues et saisie → Synthèse vocale** (selon la marque : *Accessibilité → Synthèse vocale*).
2. Moteur préféré : **Services vocaux Google** → ⚙️ → **Installer les données vocales** → **Español (España)** → télécharger.
3. Ferme et rouvre l'app.

### iPad

1. **Réglages → Accessibilité → Contenu énoncé → Voix**.
2. **Espagnol → Espagnol (Espagne)** → télécharge par exemple **Mónica** (ou Jorge, ou une voix « améliorée »).
3. Ferme et rouvre l'app.

Dans la vue gestion, le bouton 🔊 à côté du nom espagnol permet de vérifier la prononciation.

---

## 8. Sauvegarder la base SQLite

Fly.io fait un snapshot quotidien du volume (`fly volumes snapshots list kanban_data`), conservé quelques jours.

Copie sur le Mac, à la demande :

```sh
fly ssh console        # puis, dans la console de la machine :
node -e "new (require('node:sqlite').DatabaseSync)('/data/kanban/kanban.db').exec(\"VACUUM INTO '/data/kanban/backup.db'\")"
exit
fly ssh sftp get /data/kanban/backup.db kanban-$(date +%F).db
fly ssh console -C "rm /data/kanban/backup.db"
```

**Restauration** : `fly ssh sftp shell` → `put kanban-AAAA-MM-JJ.db /data/kanban/restore.db`, puis
`fly ssh console` → `mv /data/kanban/restore.db /data/kanban/kanban.db && rm -f /data/kanban/kanban.db-wal /data/kanban/kanban.db-shm`,
et enfin `fly machine restart`.
