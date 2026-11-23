# Tâches de la famille / Tareas de la familia

Tableau de tâches familial à 2 colonnes, « À faire / Por hacer » et « Fini ! / ¡Terminado! ». Il sert de rituel quotidien
sur un écran partagé, et les enfants qui ne lisent pas peuvent l'utiliser : pictogrammes, avatars et lecture à voix haute en espagnol.

- **Vue rituel** (par défaut) :
  - un tap sur une carte choisit qui a fait la tâche ;
  - la carte se fait glisser vers « Fini ! », ou on appuie sur la grosse flèche ;
  - 🔊 lit le nom de la tâche en espagnol.
- **Vue gestion** (bouton ⚙️, ou `http://IP:8090/#gestion`) : tâches, membres, photos et remise à zéro manuelle.
- **Remise à zéro** : chaque jour à 03:00, les tâches récurrentes reviennent dans « À faire » avec les mêmes personnes attribuées.

Configuration (variables d'environnement) :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8090` | port HTTP |
| `RESET_TIME` | `03:00` | heure de la remise à zéro quotidienne (fuseau `Europe/Paris`) |
| `DATA_DIR` | `./data/kanban` (Docker : `/data/kanban`) | base SQLite `kanban.db` et dossier `photos/` |

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
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
open http://localhost:8090
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

`docker-compose.local.yml` publie simplement le port et range les données dans `./data/kanban`.
Sur le serveur, on utilise seulement `docker-compose.yml`, en mode réseau `host` (voir § 5).

---

## 4. Déploiement sur le serveur (Ubuntu 24.04)

> Toutes ces commandes se lancent **sur le serveur**, par SSH. Remplace `user@serveur` par ton accès.

### 4.1 Installer Docker (si `docker --version` ne répond rien)

Dépôt officiel Docker :

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker      # Docker redémarre avec le serveur
sudo usermod -aG docker $USER           # docker sans sudo (se reconnecter ensuite)
```

Vérification : `docker --version && docker compose version`.

### 4.2 Préparer le dossier de données

Le conteneur tourne avec l'utilisateur `node` (uid 1000) :

```sh
sudo mkdir -p /data/kanban/photos
sudo chown -R 1000:1000 /data/kanban
```

### 4.3 Copier le projet et lancer

Depuis le Mac (sans `node_modules`, `dist` ni `data`) :

```sh
rsync -av --exclude node_modules --exclude dist --exclude data --exclude .git \
  ./ user@serveur:~/family-kanban/
```

Puis sur le serveur :

```sh
cd ~/family-kanban
docker compose up -d --build
docker compose ps            # doit afficher (healthy) après quelques secondes
docker compose logs -f       # journal de l'app
```

Pour changer de port ou d'heure de remise à zéro, crée un fichier `.env` à côté de `docker-compose.yml`,
puis relance `docker compose up -d` :

```sh
PORT=8090
RESET_TIME=03:00
```

**Mise à jour** : refaire le `rsync`, puis `docker compose up -d --build`. Les données de `/data/kanban` sont conservées.

### 4.4 Redémarrage automatique (mises à jour de 4 h 30)

- `restart: unless-stopped` et `systemctl enable docker` : l'app revient seule après un redémarrage du serveur.
- SQLite est en mode WAL avec `synchronous = FULL` : chaque modification est écrite sur disque immédiatement.
- Au démarrage, l'app rattrape la remise à zéro si elle a été manquée (serveur éteint à 03:00). Un redémarrage
  à 4 h 30, après la remise à zéro de 03:00, ne la refait pas.

---

## 5. Pare-feu UFW : port 8090 en réseau local uniquement

**Remplace `192.168.1.0/24` par ton sous-réseau** (`ip -4 addr` sur le serveur : une adresse `192.168.1.42/24`
correspond au réseau `192.168.1.0/24`).

```sh
sudo ufw allow from 192.168.1.0/24 to any port 8090 proto tcp comment 'Kanban familial (LAN)'
sudo ufw status numbered
```

Test depuis un appareil du réseau local : `http://IP-DU-SERVEUR:8090`.

> **Pourquoi `network_mode: host` ?** Quand Docker publie un port (`ports: "8090:8090"`), il ajoute ses propres
> règles iptables, qui passent **avant** UFW : le port serait alors joignable même si UFW le bloque. En mode `host`,
> l'app écoute directement sur le port 8090 du serveur, et la règle UFW ci-dessus s'applique normalement.
> Si Open WebUI a été lancé avec `ports:`, il est concerné par ce problème : vérifie avec `sudo iptables -L DOCKER -n`.

---

## 6. Installer l'application sur les appareils (PWA)

Ouvre `http://IP-DU-SERVEUR:8090` sur l'appareil.

> **À savoir :** les navigateurs n'installent une vraie PWA (plein écran, service worker) qu'en HTTPS. Sur le réseau
> local en HTTP, il faut donc l'une des astuces ci-dessous. L'app n'a besoin d'aucun accès à Internet :
> tout (polices, sons, emojis) est embarqué.

### Tablette Android (Chrome)

1. Dans Chrome, ouvre `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
2. Saisis `http://IP-DU-SERVEUR:8090`, passe le réglage sur **Enabled**, puis appuie sur **Relaunch**.
3. Ouvre l'app, menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
4. L'app s'ouvre en plein écran, en paysage.

### iPad (Safari)

1. Ouvre l'app dans Safari, bouton Partager → **Sur l'écran d'accueil**.
2. L'app s'ouvre sans barre Safari. L'iPad ignore le verrouillage en paysage : tourne la tablette en paysage, puis
   active le verrouillage de la rotation dans le Centre de contrôle.

### PC avec écran tactile

- Même réglage que pour Android dans Chrome ou Edge (`edge://flags/#unsafely-treat-insecure-origin-as-secure`), puis
  menu → **Installer**.
- Ou bien en mode kiosque : `chrome --kiosk http://IP-DU-SERVEUR:8090`.

### TV

Ouvre l'adresse dans le navigateur de la TV et ajoute-la aux favoris. Sans écran tactile, utilise la grosse flèche
de chaque carte pour la déplacer. Le haut-parleur est masqué si la TV n'a pas de synthèse vocale.

### Téléphones (gestion)

Ouvre simplement `http://IP-DU-SERVEUR:8090/#gestion` et ajoute la page aux favoris ou à l'écran d'accueil.
Une modification faite sur un téléphone apparaît sur l'écran partagé en 3 secondes au plus.

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

## 8. Ajouter des photos

Les avatars et les pictogrammes peuvent être des photos (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`) déposées dans
`/data/kanban/photos` sur le serveur.

Depuis le Mac :

```sh
scp photo-lea.jpg doudou.png user@serveur:/data/kanban/photos/
```

Sur le serveur, si besoin, corrige les droits : `sudo chown 1000:1000 /data/kanban/photos/*`.
Elles apparaissent aussitôt dans l'onglet **Photos / Fotos** du sélecteur d'image de la vue gestion.
Conseil : des images carrées d'environ 300 × 300 px.

---

## 9. Sauvegarder la base SQLite

Toutes les données sont dans `/data/kanban/kanban.db`, plus les photos.

Sauvegarde cohérente, même app en marche, sans rien installer :

```sh
mkdir -p /data/backups
docker exec family-kanban node -e "new (require('node:sqlite').DatabaseSync)('/data/kanban/kanban.db').exec(\"VACUUM INTO '/data/kanban/backup.db'\")"
mv /data/kanban/backup.db /data/backups/kanban-$(date +%F).db
```

Sauvegarde quotidienne à 2 h (`crontab -e`) :

```cron
0 2 * * * docker exec family-kanban node -e "new (require('node:sqlite').DatabaseSync)('/data/kanban/kanban.db').exec(\"VACUUM INTO '/data/kanban/backup.db'\")" && mv /data/kanban/backup.db /data/backups/kanban-$(date +\%F).db
```

**Restauration** : `docker compose down`, copie la sauvegarde vers `/data/kanban/kanban.db`, supprime
`kanban.db-wal` et `kanban.db-shm`, puis `docker compose up -d`.
