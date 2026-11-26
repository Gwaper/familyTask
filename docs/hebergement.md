# Benchmark d'hébergement

Comparatif fait le 26/11/2026. Les prix sont ceux trouvés à cette date, hors TVA, et changent souvent : **à revérifier
sur la page tarifs de chaque hébergeur avant de choisir.**

## Ce dont l'app a besoin

| Besoin | Pourquoi |
|---|---|
| **Disque persistant** (~1 Go) | SQLite (`kanban.db`) et `photos/` sont des fichiers. Sans disque, tout est perdu à chaque déploiement. |
| **Un seul conteneur Node 24** | Le `Dockerfile` existe déjà ; un seul process sert l'API, le front et les photos. Une seule instance (SQLite). |
| **HTTPS** | Obligatoire pour installer la PWA sur téléphone et pour le cookie du code famille. |
| **Peut s'endormir** | La remise à zéro manquée est rattrapée au démarrage : pas besoin d'une machine allumée 24 h/24. |
| **Déploiement depuis GitHub Actions** | Chaque push sur `main` doit partir en production sans intervention. |
| **Région UE** | Latence (polling toutes les 3 s) et données de la famille en Europe. |

## Tableau comparatif

| Hébergeur | Disque persistant | Coût mensuel estimé | HTTPS | Région UE | Veille / réveil | GitHub Actions | Maintenance |
|---|---|---|---|---|---|---|---|
| **Fly.io** | ✅ Volume (0,15 $/Go) | **0 $** : offre Free avec 5 $ d'usage inclus par mois ; l'app consomme ~1-2,5 $ (machine 256 Mo 2,19 $ si allumée en continu, facturée seulement quand elle tourne + 1 Go de volume 0,15 $) | ✅ auto | ✅ Paris (`cdg`) | ✅ arrêt auto, réveil ~1-2 s | ⭐⭐⭐ action officielle `setup-flyctl` + 1 secret, build distant | Aucune (pas d'OS à gérer) |
| Railway | ✅ Volume (0,15 $/Go) | ~5 $ (abonnement Hobby, 5 $ d'usage inclus) | ✅ auto | ✅ Amsterdam | ✅ option « serverless » | ⭐⭐⭐ déploiement auto sur push ou CLI `railway up` + token | Aucune |
| Render | ✅ Disque (0,25 $/Go), offres payantes seulement | ~7-8 $ (instance Starter + disque) | ✅ auto | ✅ Francfort | ❌ disque impossible sur l'offre gratuite qui s'endort | ⭐⭐ deploy hook (URL secrète) ou déploiement auto | Aucune |
| Koyeb | ⚠️ Volumes en préversion, interdits sur l'instance gratuite | ~5 $+ (instance payante) | ✅ auto | ✅ Paris / Francfort | ✅ scale-to-zero | ⭐⭐ action officielle | Aucune, mais volumes peu matures |
| VPS Hetzner (CX22) | ✅ disque local | ~4,50 € (après la hausse d'avril 2026, plusieurs offres « non disponibles » mi-2026) | ⚠️ à installer (Caddy) | ✅ Allemagne / Finlande | ❌ toujours allumé | ⭐ build → GHCR → SSH `docker compose pull` (clé SSH en secret) | Mises à jour OS, pare-feu, sauvegardes, certificats |
| VPS OVH / Scaleway | ✅ disque local | ~4-7 € | ⚠️ à installer | ✅ France | ❌ toujours allumé | ⭐ comme Hetzner | Comme Hetzner |
| Oracle Cloud Free Tier | ✅ disque local | 0 € | ⚠️ à installer | ✅ Paris / Marseille | ❌ | ⭐ comme Hetzner | Comme Hetzner, + comptes gratuits parfois récupérés par Oracle |
| Google Cloud Run | ❌ disque éphémère (il faudrait Litestream vers un bucket) | ~0-1 € | ✅ auto | ✅ Paris | ✅ | ⭐⭐ action `deploy-cloudrun` + compte de service | Réplication SQLite à ajouter : plus de code |
| Vercel / Netlify / Cloudflare Pages | ❌ fonctions sans disque | — | ✅ | ✅ | ✅ | ⭐⭐⭐ | **Incompatible sans réécriture** (D1, KV…) |

⭐⭐⭐ = une étape et un secret ; ⭐ = pipeline à écrire et serveur à maintenir.

## Recommandation : Fly.io

- **Rien à réécrire** : le `Dockerfile` actuel est déployé tel quel, le volume est monté sur `/data/kanban`.
- **Gratuit en pratique** : l'offre Free inclut 5 $ d'usage par mois (jusqu'à 3 machines) ; au-delà, passage automatique
  au paiement à l'usage sans interruption. La machine s'arrête quand aucun écran n'est ouvert (`auto_stop_machines`),
  la remise à zéro est rattrapée au réveil. Le volume est compté même machine arrêtée.
- **GitHub Actions le plus simple** : `flyctl deploy --remote-only` avec un seul secret (`FLY_API_TOKEN`) ; le build se fait
  chez Fly, pas de registre d'images à gérer.
- **Zéro maintenance** : HTTPS, certificats, OS et redémarrages gérés par Fly. Snapshots quotidiens du volume.
- **Points d'attention** : l'offre Free est limitée à 1 administrateur du compte Fly.io (la personne qui déploie) ;
  le nombre d'appareils qui utilisent l'app n'est pas limité. Support communautaire uniquement ; un seul volume = une seule machine (pas de haute disponibilité, suffisant pour une famille) .

**Alternative** si on préfère un tarif fixe et un contrôle total : un VPS (Hetzner, OVH) avec Docker + Caddy, déployé par
GitHub Actions (build → GHCR → SSH). Plus de maintenance (mises à jour, pare-feu, sauvegardes).

## Sources

- [Fly.io — tarifs](https://fly.io/pricing) (offre Free vérifiée sur la page tarifs le 26/11/2026), [mise à jour 2026](https://fly.io/pricing-update/), [tarifs détaillés](https://fly.io/docs/about/pricing/)
- [Railway — offres](https://docs.railway.com/pricing/plans)
- [Render — disques persistants](https://docs.render.com/disks), [Render — tarifs](https://render.com/pricing)
- [Koyeb — FAQ tarifs](https://www.koyeb.com/docs/faqs/pricing)
- [Hausse Hetzner avril 2026 (Tom's Hardware)](https://www.tomshardware.com/tech-industry/hetzner-to-raise-prices-by-up-to-37-percent-from-april-1),
  [Hetzner 2026 (findstack)](https://findstack.com/resources/hetzner-price-increase-2026)
