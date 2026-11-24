# Dash4 — QG (maquette « jeu vidéo »)

Interface de Dash4 façon jeu vidéo, branchée sur les vraies données de `dash4-api`, **avec les mêmes accès que dash4-web** (même menu, mêmes permissions, comptes gestionnaires). On y travaille en parallèle de dash4-web pour valider le style avant de le reporter dans `dash4-web` et `dash4-mobile`. Couleurs : la palette de dash4-web (émeraude, zinc, sky, orange, rouge, violet), en plus lumineux.

Les écrans pas encore refaits ouvrent le même écran dans dash4-web (`VITE_DASH4_WEB_URL`, par défaut `https://dash4web.netlify.app`).

| Écran | Données | Esprit « jeu » |
|---|---|---|
| QG | tableau de bord, outils, véhicules | tuiles animées, compteurs qui défilent, missions du jour, jauges |
| Missions | tâches | cartes de quête (priorité = couleur), objectifs = sous-tâches |
| Chantiers | projets | cartes de « monde », avancement du chantier |
| Inventaire | articles du stock | cases d'inventaire avec photo, rareté selon le seuil d'alerte |
| Armurerie | outillage | disponible / sorti / en retard |
| Garage | véhicules | photo, « points de vie » selon papiers et entretiens |

Le joueur gagne de l'expérience avec ses tâches terminées (calcul seulement, rien n'est enregistré).

Sur ordinateur : barre latérale avec tout le menu de dash4-web. Sur téléphone : barre d'onglets en bas (QG, Chantiers, Missions, Inventaire) et « Menu » pour le reste.

## Accessibilité

Réglages (⚙️) : animations, contraste élevé, taille du texte, sons. Les animations s'arrêtent aussi si l'appareil demande moins de mouvement. Navigation complète au clavier, lien « Aller au contenu », jauges lues comme barres de progression.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5175, API locale (http://localhost:8000/api)
npm run build
npm test
```

`VITE_API_URL` choisit l'API (par défaut en production : `https://api.dash4.yonkou.info/api`).

## Mise en place

1. Sur l'API (`.env`) : ajouter l'adresse de la maquette à `FRONTEND_URLS`, par exemple `https://dash4webdemo.netlify.app`, puis `php artisan optimize`.
2. Se connecter avec son compte Dash4 habituel (gestionnaire). Pour une démonstration sans risque : un compte au profil **Lecture seule**.
3. Sur Netlify : nouveau site depuis ce repo (le `netlify.toml` suffit).
