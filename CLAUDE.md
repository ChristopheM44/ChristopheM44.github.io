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

All game state lives in `src/composables/usePlayers.js`, which persists to `localStorage` (key `flip7_master_data`, object `{ players, manches, settings }`) via a deep `watch`. `settings = { variant: 'classic' | 'vengeance', brutal }` is chosen per game and locked (`isLocked`) as soon as any player has a round. The composable is only consumed by `App.vue`.

**Component tree:**

```
App.vue                  — variant selector (Classique / Vengeance + Mode Brutal)
├── PlayerCard.vue       — one per player, owns showHistory toggle
├── AddPlayerModal.vue   — overlay, emits 'add' (name) or 'close'
├── ScoringModal.vue     — overlay, "Cartes" or "Score direct" tabs, emits 'save' (roundData, score, attack?) or 'close'
└── RecapModal.vue       — finished manches, with Vengeance / Brutal badges
```

`App.vue` holds the modal-visibility refs (`showAddPlayerModal`, `showRecapModal`, `scoringPlayerIndex`) and computes `sortedPlayers` (by score desc, keeping `originalIndex` to map back to the mutable `players` array). `opponents` passed to `ScoringModal` carry real indexes into `players`.

### Scoring rules (pure functions in `src/scoring.js`)

Classic (`scoreClassic`):
- Cards 0–12, modifiers +2 to +10 stack; 2× multiplier applies only to the number sum
- 7 unique card values without bust = **Flip7** bonus (+15 pts); bust = 0 pts (explicit Bust button)

Vengeance (`scoreVengeance`):
- Cards 0–13; tapping 13 twice = Lucky 13 (both count). Unlucky 7 button resets the hand to `[7]`
- Zero card: number total is 0 unless Flip 7
- Order: sum → ÷2 (floor) → −2/−4/−6/−8/−10 → floor at 0 (not in Brutal) → +15 if Flip 7
- Flip 7 = 7 number cards
- Brutal: negative rounds allowed, busted player scores −(received modifiers), Flip 7 bonus can instead be −15 to an opponent (stored as a `{ type: 'attack' }` round on the target; totals may go below 0)

Winner threshold: 200 points (shown with crown in PlayerCard).

## GitHub Pages deployment

The site deploys from the `gh-pages` branch via the `gh-pages` npm package:

1. `npm run deploy` — builds and pushes `dist/` to `gh-pages` (with `.nojekyll`)
2. In GitHub → Settings → Pages → set **Source** to branch `gh-pages`, folder `/ (root)`

`base: '/'` in `vite.config.js` is correct because this is a user pages site (`username.github.io`) served at the domain root.
