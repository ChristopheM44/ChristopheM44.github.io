# AGENTS.md

Guidance for AI coding agents (Codex, Claude, etc.) working in this repository.

## Stack & tooling

- **Vue 3** — Composition API only (`<script setup>`). Do not use Options API.
- **Vite 6** — bundler. Dev server runs on port **5174**.
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin. No `tailwind.config.js`. Extend the theme using `@theme {}` blocks in `src/style.css`. Do not create a config file.
- **No test framework** — verify changes by running `npm run build` (must exit 0).

## Before submitting changes

Always run:
```bash
npm run build
```
A clean build with no errors or warnings is the acceptance criterion.

## State & data flow

- All player data flows from `src/composables/usePlayers.js` → `App.vue` → child components via props/emits.
- Do not introduce a global store (Pinia, Vuex) — the composable pattern is intentional for this app size.
- Persist player data only via the `saveRoundScore`, `addPlayer`, `removePlayer`, `resetGame` functions in the composable. Do not write to `localStorage` directly in components.

## Component conventions

- Keep round-draft state (selected cards, modifiers, multiplier) local to `ScoringModal.vue` — it is ephemeral and must not leak to the store.
- Modals are v-if'd in `App.vue`; they mount fresh each time, so no manual reset needed.
- `sortedPlayers` in `App.vue` maps each player to its `originalIndex` in the mutable `players.value` array. Always use `originalIndex` for mutations, not the sorted position.

## Styling rules

- Prefer Tailwind utility classes. Use inline `style` only for dynamic values (e.g., `calc()` with CSS env vars) or gradients that can't be expressed as utilities.
- Custom animations (`animate-shake`, `fade-in`) are defined in `src/style.css` — add new ones there, not in component `<style>` blocks.
- Color palette maps to Tailwind built-ins: `slate-950` (bg), `slate-800` (surface), `slate-700` (surface-alt), `indigo-500` (primary), `emerald-500` (secondary), `amber-400` (accent), `red-500` (danger).

## Deployment

`npm run deploy` builds and pushes to the `gh-pages` branch. Never commit the `dist/` folder to `main`.
