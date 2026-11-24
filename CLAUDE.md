# dash4webdemo — consignes

- Maquette « jeu vidéo » de Dash4 pour valider le style (web et mobile dans la même appli, responsive) avant de le reporter dans dash4-web et dash4-mobile.
- Vue 3.5 + Vite 8 + TypeScript + Vue Router 5, sans bibliothèque d'interface : styles dans `src/styles/game.css`. Interface en français, code en anglais.
- **Mêmes accès que dash4-web** : même menu et mêmes permissions (`src/navigation.ts` reprend `dash4-web/src/menu.ts` ; le garder aligné), réservé aux comptes gestionnaires. On y travaille en parallèle de dash4-web : appels API uniquement via `api` (`src/services/api.ts`, client de `@dash4/shared`). Un écran pas encore refait renvoie vers le même écran de dash4-web. Le profil « Lecture seule » (`viewer`) sert aux démonstrations.
- **Palette de dash4-web** (Aura : émeraude, zinc, sky, orange, rouge, violet), en nuances plus lumineuses : variables dans `src/styles/game.css`, ne pas coder de couleur en dur.
- Accessibilité obligatoire : contrastes AA, focus visible, cibles de 44 px, `aria-*` sur les jauges et les filtres, animations coupées par `prefers-reduced-motion` ou par les réglages (`--speed`, `.no-motion`), contraste élevé, taille du texte.
- Les règles « jeu » (niveau, rareté, points de vie) sont dans `src/utils/game.ts`, calculées depuis les vraies données, avec leurs tests Vitest.
- Push direct sur `main` (déploiement Netlify).
