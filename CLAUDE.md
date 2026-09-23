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

All game state lives in `src/composables/useGame.js` — a module-level singleton (every `useGame()` call shares the same refs) persisted to `localStorage` key `score_master_data` as `{ version: 2, current, history }` via a deep `watch`. Without v2 data, an old `flip7_master_data` payload is migrated: its players become `current`, and each of its old "manches" (games to 200) becomes a `history` entry (the old key is left untouched).

Vocabulary: **Partie** (a game: players, settings, ends when someone reaches `target`) › **Manche** (one row of scores).

```
Partie (current) = { id, createdAt, game: 'flip7' | 'generic', name,
                     settings: { variant, brutal, target, lowestWins },
                     players: [{ name, startManche, rounds: [{ manche, score, timestamp, ...flip7 details }] }] }
History entry    = { id, createdAt, endedAt, game, name, settings, winners,
                     results: [{ name, score, manches: { [n]: score } | null }] }
```

- Totals are **never stored**: always `playerTotal(p)` (sum of rounds). Player names are the identity — duplicates are rejected (`sameName`).
- Every game scores one player at a time through `saveRoundScore(index, roundData, score, attack, manche)`. The default manche is `nextMancheFor(player)` (first unplayed manche ≥ `startManche`, so gaps get filled). Saving on an already played manche replaces it, along with its linked Brutal attack (`from` + `timestamp`). `deleteRound` removes a round and its attack. Late joiners get `startManche = playingManche`.
- After each save, `GameView` prompts "Fin de partie" when the manche is complete (`isMancheComplete`) and someone reached `target`; `finishPartie()` moves the partie to `history` and returns its id for `ResultView`.

**Screens** (`App.vue` switches on a local `screen` ref and provides `askConfirm` to views):

```
App.vue                   — screen switch + ConfirmModal
├── views/HomeView.vue    — current partie (Reprendre / Abandonner), new partie, history link
├── views/SetupView.vue   — game name + presets (Skyjo…), Brutal, end score, winner direction, players
├── views/GameView.vue    — Cartes / Tableau tabs, end-of-partie prompt
│   ├── PlayerCard.vue    — one per player, "Points" button
│   ├── ScoreTable.vue    — rows = manches, columns = players; tap a cell to correct it
│   ├── ScoringModal.vue  — score entry for all games (variant 'generic' = direct score only), edit mode with Effacer
│   │   └── ScoreKeypad.vue — calculator keypad for the direct score (digits, + − × ÷, physical keyboard too)
│   └── AddPlayerModal.vue
├── views/ResultView.vue  — final ranking + ScoreTable, "Rejouer"
└── views/HistoryView.vue — filter by game, wins per player, finished parties
```

Pure helpers (`evaluateExpression` for the keypad — × ÷ first, leading − = negative, result floored, `null` on ÷0 —, `playerTotal`, `mancheScores`, `currentManche`, `nextMancheFor`, `isMancheComplete`, `rankStandings`, `sameName`) live in `src/scoring.js`.

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

Flip 7 default end score: 200 points. The crown in PlayerCard goes to the winner(s) once someone reached the partie's `target` (lowest total wins when `lowestWins`).

## GitHub Pages deployment

The site deploys from the `gh-pages` branch via the `gh-pages` npm package:

1. `npm run deploy` — builds and pushes `dist/` to `gh-pages` (with `.nojekyll`)
2. In GitHub → Settings → Pages → set **Source** to branch `gh-pages`, folder `/ (root)`

`base: '/'` in `vite.config.js` is correct because this is a user pages site (`username.github.io`) served at the domain root.
