# Dash4 — QG (maquette « jeu vidéo »)

Maquette de l'interface de Dash4 façon jeu vidéo, **branchée en lecture seule** sur les vraies données de `dash4-api`. Elle sert à valider le style avant de le reporter dans `dash4-web` et `dash4-mobile`.

| Écran | Données | Esprit « jeu » |
|---|---|---|
| QG | tableau de bord, outils, véhicules | tuiles animées, compteurs qui défilent, missions du jour, jauges |
| Missions | tâches | cartes de quête (priorité = couleur), objectifs = sous-tâches |
| Chantiers | projets | cartes de « monde », avancement du chantier |
| Inventaire | articles du stock | cases d'inventaire avec photo, rareté selon le seuil d'alerte |
| Armurerie | outillage | disponible / sorti / en retard |
| Garage | véhicules | photo, « points de vie » selon papiers et entretiens |

Le joueur gagne de l'expérience avec ses tâches terminées (calcul seulement, rien n'est enregistré).

Sur ordinateur : barre latérale. Sur téléphone : barre d'onglets en bas.

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
2. Dans Dash4 › Utilisateurs : créer un compte gestionnaire avec le profil **Lecture seule**.
3. Sur Netlify : nouveau site depuis ce repo (le `netlify.toml` suffit).
