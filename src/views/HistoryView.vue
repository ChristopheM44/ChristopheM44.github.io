<script setup>
import { ref, computed, inject } from 'vue'
import { useGame } from '../composables/useGame.js'

defineEmits(['back', 'open'])
const askConfirm = inject('askConfirm')

const { history, deletePartie } = useGame()

// Filtre par nom de jeu (null = tous)
const filter = ref(null)
const gameNames = computed(() => [...new Set(history.value.map(p => p.name))])
// Un filtre dont toutes les parties ont été supprimées retombe sur « Tous »
const activeFilter = computed(() => (gameNames.value.includes(filter.value) ? filter.value : null))
const parties = computed(() => history.value.filter(p => activeFilter.value === null || p.name === activeFilter.value))

// Victoires par joueur (chaque ex æquo compte une victoire)
const tally = computed(() => {
  const wins = {}
  parties.value.forEach(p => p.winners.forEach(w => { wins[w] = (wins[w] ?? 0) + 1 }))
  return Object.entries(wins)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mancheCount(partie) {
  return Math.max(0, ...partie.results.flatMap(r => Object.keys(r.manches ?? {}).map(Number)))
}

function winnerScore(partie) {
  return partie.results.find(r => r.name === partie.winners[0])?.score
}

function handleDelete(partie) {
  askConfirm({
    title: 'Supprimer la partie',
    message: `Supprimer « ${partie.name} » du ${formatDate(partie.endedAt)} de l'historique ?`,
    confirmLabel: 'Supprimer',
    danger: true,
    action: () => deletePartie(partie.id)
  })
}
</script>

<template>
  <div class="px-5 pb-10 min-h-screen" style="padding-top: calc(var(--safe-top) + 12px)">
    <div class="max-w-xl mx-auto">
      <button
        @click="$emit('back')"
        class="px-3 py-1.5 mb-3 rounded-lg text-sm font-semibold transition border-none cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
      >← Accueil</button>

      <h1 class="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
        Historique
      </h1>

      <div v-if="history.length === 0" class="text-center py-10 text-slate-400">
        Aucune partie terminée.
      </div>

      <template v-else>
        <!-- Filtre par jeu -->
        <div class="flex flex-wrap gap-1.5 mb-4">
          <button
            v-for="opt in [{ value: null, label: 'Tous' }, ...gameNames.map(n => ({ value: n, label: n }))]"
            :key="opt.label"
            @click="filter = opt.value"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-semibold transition border-none cursor-pointer',
              activeFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            ]"
          >{{ opt.label }}</button>
        </div>

        <!-- Victoires -->
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Victoires</div>
        <div class="flex flex-wrap gap-2 mb-6">
          <div
            v-for="t in tally"
            :key="t.name"
            class="flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1.5"
          >
            <span class="font-semibold text-sm text-slate-200">{{ t.name }}</span>
            <span class="text-amber-400 font-bold text-sm">{{ t.count }} 🏆</span>
          </div>
        </div>

        <!-- Parties -->
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Parties</div>
        <div class="grid gap-3">
          <div
            v-for="partie in parties"
            :key="partie.id"
            class="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-800 border border-white/5"
          >
            <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('open', partie.id)">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ partie.name }}</span>
                <span v-if="partie.settings.brutal" class="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 rounded px-1.5 py-0.5">Brutal</span>
              </div>
              <div class="text-xs text-slate-400">
                {{ formatDate(partie.endedAt) }}<template v-if="mancheCount(partie)"> · {{ mancheCount(partie) }} manche{{ mancheCount(partie) > 1 ? 's' : '' }}</template>
              </div>
              <div class="text-sm text-amber-400 font-semibold truncate">👑 {{ partie.winners.join(' & ') }} · {{ winnerScore(partie) }}</div>
              <div class="text-xs text-slate-500 truncate">{{ partie.results.map(r => r.name).join(', ') }}</div>
            </div>
            <button
              @click="handleDelete(partie)"
              class="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition border-none cursor-pointer text-sm shrink-0"
            >✕</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
