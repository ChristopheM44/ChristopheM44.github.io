<script setup>
import { ref, computed, inject } from 'vue'
import { useGame } from '../composables/useGame.js'
import { mancheScores, nextMancheFor, isPlayed } from '../scoring.js'
import PlayerCard from '../components/PlayerCard.vue'
import AddPlayerModal from '../components/AddPlayerModal.vue'
import ScoringModal from '../components/ScoringModal.vue'
import ScoreTable from '../components/ScoreTable.vue'

const emit = defineEmits(['home', 'result'])
const askConfirm = inject('askConfirm')

const {
  current, players, settings, standings, ranking, manche, mancheComplete, playingManche, targetReached,
  addPlayer, removePlayer, saveRoundScore, deleteRound, finishPartie
} = useGame()

const variant = computed(() => (current.value.game === 'generic' ? 'generic' : settings.value.variant))
const leaders = computed(() => (targetReached.value ? ranking.value.winners : []))

const tab = ref('cards') // 'cards' | 'table'
const showAddPlayerModal = ref(false)

// --- Joueurs ---

function handleAddPlayer(name) {
  addPlayer(name)
  showAddPlayerModal.value = false
}

function handleRemovePlayer(index) {
  askConfirm({
    title: 'Supprimer un joueur',
    message: `Supprimer ${players.value[index].name} ?`,
    confirmLabel: 'Supprimer',
    danger: true,
    action: () => removePlayer(index)
  })
}

// --- Saisie (tous les jeux : un joueur à la fois) ---

// null | { index, manche, editing, initialScore }
const scoring = ref(null)

function openScoring(index) {
  scoring.value = { index, manche: nextMancheFor(players.value[index]), editing: false, initialScore: null }
}

// Case du tableau : corrige (ou complète) la manche n de ce joueur
function openCell(name, n) {
  const index = players.value.findIndex(p => p.name === name)
  const round = players.value[index].rounds.find(r => isPlayed(r) && r.manche === n)
  scoring.value = { index, manche: n, editing: !!round, initialScore: round?.score ?? null }
}

const opponents = computed(() =>
  players.value
    .map((p, i) => ({ name: p.name, index: i }))
    .filter(o => o.index !== scoring.value?.index)
)

function handleSaveScore(roundData, score, attack) {
  const { index, manche: n } = scoring.value
  saveRoundScore(index, roundData, score, attack, n)
  scoring.value = null
  checkEndOfPartie()
}

function handleDeleteScore() {
  const { index, manche: n } = scoring.value
  deleteRound(index, n)
  scoring.value = null
}

const tableColumns = computed(() =>
  standings.value.map(s => ({ name: s.name, manches: mancheScores(s.player), total: s.total }))
)

// --- Fin de partie ---

function winnerMessage() {
  const w = ranking.value.winners
  return w.length > 1 ? `Égalité : ${w.join(' & ')} !` : `${w[0]} gagne la partie !`
}

// Manche ignorée via « Continuer » : on ne redemande pas pour cette manche
const dismissedManche = ref(null)

function checkEndOfPartie() {
  if (!mancheComplete.value || !targetReached.value || dismissedManche.value === manche.value) return
  const n = manche.value
  askConfirm({
    title: 'Fin de partie',
    message: `Score de fin atteint (${settings.value.target}).\n${winnerMessage()}`,
    confirmLabel: 'Terminer la partie',
    action: finish,
    cancelLabel: 'Continuer',
    cancelAction: () => { dismissedManche.value = n }
  })
}

function finish() {
  const id = finishPartie()
  if (id) emit('result', id)
  else emit('home')
}

function handleEndPartie() {
  const hasScores = players.value.some(p => p.rounds.length > 0)
  askConfirm({
    title: 'Terminer la partie',
    message: hasScores
      ? `${winnerMessage()}\nLa partie sera rangée dans l'historique.`
      : 'Aucun score saisi : la partie sera abandonnée.',
    confirmLabel: 'Terminer',
    action: finish
  })
}
</script>

<template>
  <div class="px-5 pb-32 min-h-screen" style="padding-top: calc(var(--safe-top) + 12px)">
    <div class="max-w-xl mx-auto">
      <button
        @click="$emit('home')"
        class="px-3 py-1.5 mb-3 rounded-lg text-sm font-semibold transition border-none cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
      >← Accueil</button>

      <h1 class="text-4xl font-bold text-center mb-1 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
        {{ current.name }}
      </h1>
      <div class="flex flex-wrap justify-center items-center gap-2 mb-5 text-sm text-slate-400">
        <span>Manche {{ playingManche }}</span>
        <span v-if="settings.brutal" class="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 rounded px-1.5 py-0.5">Brutal</span>
        <span v-if="settings.target != null" class="text-[10px] font-bold uppercase bg-slate-700 text-slate-300 rounded px-1.5 py-0.5">Fin à {{ settings.target }}</span>
        <span v-if="settings.lowestWins" class="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 rounded px-1.5 py-0.5">Plus petit gagne</span>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4">
        <button
          v-for="opt in [{ value: 'cards', label: 'Cartes' }, { value: 'table', label: 'Tableau' }]"
          :key="opt.value"
          @click="tab = opt.value"
          :class="[
            'flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer',
            tab === opt.value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
          ]"
        >{{ opt.label }}</button>
      </div>

      <div v-if="players.length === 0" class="text-center py-10 text-slate-400">
        Ajoutez des joueurs pour commencer...
      </div>

      <div v-else-if="tab === 'cards'" class="grid gap-4">
        <PlayerCard
          v-for="s in ranking.sorted"
          :key="s.name"
          :player="s.player"
          :total="s.total"
          :leader="leaders.includes(s.name)"
          @score="openScoring(s.index)"
          @remove="handleRemovePlayer(s.index)"
        />
      </div>

      <template v-else>
        <ScoreTable
          :columns="tableColumns"
          :manche-count="manche"
          :leaders="manche > 0 ? ranking.winners : []"
          editable
          @edit="openCell"
        />
        <p v-if="manche > 0" class="text-xs text-slate-500 text-center mt-2">Touchez une case pour la corriger.</p>
      </template>
    </div>
  </div>

  <!-- Bottom Controls -->
  <div class="fixed bottom-0 left-0 right-0 px-5 py-5 flex justify-center gap-3 z-10"
       style="background: linear-gradient(transparent, #0f172a 20%)">
    <button
      @click="showAddPlayerModal = true"
      class="border-none rounded-xl px-5 py-3 font-semibold text-base cursor-pointer transition-all inline-flex items-center gap-2 bg-slate-700 text-slate-100 hover:bg-slate-600"
    >
      + Joueur
    </button>
    <button
      @click="handleEndPartie"
      class="border-none rounded-full px-7 py-3 font-semibold text-lg cursor-pointer transition-all inline-flex items-center gap-2 bg-indigo-500 text-white hover:bg-indigo-400 hover:-translate-y-0.5"
      style="box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4)"
    >
      Terminer la partie
    </button>
  </div>

  <AddPlayerModal
    v-if="showAddPlayerModal"
    :existing-names="players.map(p => p.name)"
    @add="handleAddPlayer"
    @close="showAddPlayerModal = false"
  />
  <ScoringModal
    v-if="scoring"
    :player="players[scoring.index]"
    :variant="variant"
    :brutal="settings.brutal"
    :opponents="opponents"
    :manche="scoring.manche"
    :editing="scoring.editing"
    :initial-score="scoring.initialScore"
    @save="handleSaveScore"
    @delete="handleDeleteScore"
    @close="scoring = null"
  />
</template>
