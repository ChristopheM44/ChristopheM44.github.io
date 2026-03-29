# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server on http://localhost:5174
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run deploy   # Build + push dist/ to gh-pages branch (GitHub Pages)
```

> Port 5174 is intentional — 5173 is taken by another project.

## Stack

Vue 3 (Composition API) + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite` plugin, no `tailwind.config.js`). Global CSS lives in `src/style.css` with `@import "tailwindcss"` at the top.

## Architecture

All game state lives in `src/composables/usePlayers.js`, which persists to `localStorage` (key `flip7_master_data`) via a deep `watch`. The composable returns `{ players, addPlayer, removePlayer, resetGame, saveRoundScore }` and is only consumed by `App.vue`.

**Component tree:**

```
App.vue
├── PlayerCard.vue       — one per player, owns showHistory toggle
├── AddPlayerModal.vue   — overlay, emits 'add' (name) or 'close'
└── ScoringModal.vue     — overlay, owns round draft state, emits 'save' (roundData, score) or 'close'
```

`App.vue` holds two modal-visibility refs (`showAddPlayerModal`, `scoringPlayerIndex`) and computes `sortedPlayers` (by score desc, keeping `originalIndex` to map back to the mutable `players` array).

### Scoring rules (in ScoringModal.vue)

- Cards 0–12 are toggled; selecting the same value twice = **bust** (0 pts)
- Modifiers +2 to +10 stack additionally
- 2× multiplier applies only to the number sum, not modifiers
- 7+ unique card values without bust = **Flip7** bonus (+15 pts)
- Winner threshold: 200 points (shown with crown in PlayerCard)

## GitHub Pages deployment

The site deploys from the `gh-pages` branch via the `gh-pages` npm package:

1. `npm run deploy` — builds and pushes `dist/` to `gh-pages` (with `.nojekyll`)
2. In GitHub → Settings → Pages → set **Source** to branch `gh-pages`, folder `/ (root)`

`base: '/'` in `vite.config.js` is correct because this is a user pages site (`username.github.io`) served at the domain root.
