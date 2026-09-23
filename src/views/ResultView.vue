<script setup>
import { computed, inject } from 'vue'
import { useGame } from '../composables/useGame.js'
import ScoreTable from '../components/ScoreTable.vue'

const props = defineProps({
  id: String,
  from: { type: String, default: 'home' } // écran de retour : 'home' | 'history'
})
const emit = defineEmits(['back', 'replay'])
const askConfirm = inject('askConfirm')

const { current, history, startPartie } = useGame()

const partie = computed(() => history.value.find(p => p.id === props.id))

const ranking = computed(() => {
  const p = partie.value
  return [...p.results].sort((a, b) => (p.settings.lowestWins ? a.score - b.score : b.score - a.score))
})

const table = computed(() => {
  const results = partie.value.results
  if (!results.some(r => r.manches)) return null
  const columns = results.map(r => ({ name: r.name, manches: r.manches ?? {}, total: r.score }))
  return { columns, mancheCount: Math.max(0, ...columns.flatMap(c => Object.keys(c.manches).map(Number))) }
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function replay() {
  const { game, name, settings, results } = partie.value
  const launch = () => {
    startPartie({ game, name, settings: { ...settings }, playerNames: results.map(r => r.name) })
    emit('replay')
  }
  if (!current.value) return launch()
  askConfirm({
    title: 'Partie en cours',
    message: `« ${current.value.name} » sera terminée et rangée dans l'historique.`,
    confirmLabel: 'Continuer',
    action: launch
  })
}
</script>

<template>
  <div v-if="partie" class="px-5 pb-32 min-h-screen" style="padding-top: calc(var(--safe-top) + 12px)">
    <div class="max-w-xl mx-auto">
      <button
        @click="$emit('back')"
        class="px-3 py-1.5 mb-3 rounded-lg text-sm font-semibold transition border-none cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
      >← {{ from === 'history' ? 'Historique' : 'Accueil' }}</button>

      <h1 class="text-4xl font-bold text-center mb-1 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
        {{ partie.name }}
      </h1>
      <div class="flex flex-wrap justify-center items-center gap-2 mb-6 text-sm text-slate-400">
        <span>{{ formatDate(partie.endedAt) }}</span>
        <span v-if="table">· {{ table.mancheCount }} manche{{ table.mancheCount > 1 ? 's' : '' }}</span>
        <span v-if="partie.settings.brutal" class="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 rounded px-1.5 py-0.5">Brutal</span>
        <span v-if="partie.settings.lowestWins" class="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 rounded px-1.5 py-0.5">Plus petit gagne</span>
      </div>

      <!-- Vainqueur(s) -->
      <div class="fade-in text-center rounded-xl px-4 py-4 mb-4 border border-amber-400 bg-gradient-to-br from-slate-800 to-amber-950">
        <div class="text-3xl mb-1">👑</div>
        <div class="text-xl font-bold text-amber-300">{{ partie.winners.join(' & ') }}</div>
        <div class="text-sm text-slate-300">{{ partie.winners.length > 1 ? 'remportent' : 'remporte' }} la partie</div>
      </div>

      <!-- Classement -->
      <div class="grid gap-2 mb-6">
        <div
          v-for="(r, i) in ranking"
          :key="r.name"
          :class="[
            'flex items-center gap-3 rounded-xl px-4 py-2.5',
            partie.winners.includes(r.name) ? 'bg-amber-500/15 text-amber-200' : 'bg-slate-800 text-slate-200'
          ]"
        >
          <span class="w-6 text-slate-400 font-bold">{{ i + 1 }}</span>
          <span class="flex-1 font-semibold">{{ r.name }}</span>
          <span :class="['font-bold text-lg', r.score < 0 ? 'text-red-400' : '']">{{ r.score }}</span>
        </div>
      </div>

      <template v-if="table">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Détail par manche</div>
        <ScoreTable v-bind="table" :leaders="partie.winners" />
      </template>
    </div>
  </div>

  <div v-if="partie" class="fixed bottom-0 left-0 right-0 px-5 py-5 flex justify-center gap-3 z-10"
       style="background: linear-gradient(transparent, #0f172a 20%)">
    <button
      @click="replay"
      class="border-none rounded-full px-8 py-3 font-semibold text-lg cursor-pointer transition-all inline-flex items-center gap-2 bg-indigo-500 text-white hover:bg-indigo-400 hover:-translate-y-0.5"
      style="box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4)"
    >
      Rejouer
    </button>
  </div>
</template>
