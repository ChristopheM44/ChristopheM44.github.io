<script setup>
import { ref, computed } from 'vue'
import { usePlayers } from './composables/usePlayers.js'
import PlayerCard from './components/PlayerCard.vue'
import AddPlayerModal from './components/AddPlayerModal.vue'
import ScoringModal from './components/ScoringModal.vue'
import RecapModal from './components/RecapModal.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const { players, manches, settings, isLocked, addPlayer, removePlayer, resetGame, saveCurrentManche, saveRoundScore } = usePlayers()

const isVengeance = computed(() => settings.value.variant === 'vengeance')

function setVariant(variant) {
  if (isLocked.value) return
  settings.value.variant = variant
  if (variant === 'classic') settings.value.brutal = false
}

function toggleBrutal() {
  if (isLocked.value) return
  settings.value.brutal = !settings.value.brutal
}

const opponents = computed(() =>
  players.value
    .map((p, i) => ({ name: p.name, index: i }))
    .filter(o => o.index !== scoringPlayerIndex.value)
)

const sortedPlayers = computed(() =>
  [...players.value]
    .map((p, i) => ({ player: p, originalIndex: i }))
    .sort((a, b) => b.player.score - a.player.score)
)

const showAddPlayerModal = ref(false)
const showRecapModal = ref(false)
const scoringPlayerIndex = ref(null)

function handleAddPlayer(name) {
  addPlayer(name)
  showAddPlayerModal.value = false
}

// Confirmation intégrée (confirm() est bloqué dans certains navigateurs / PWA)
const confirmState = ref(null)

function askConfirm(options) {
  confirmState.value = options
}

function handleConfirm() {
  const action = confirmState.value.action
  confirmState.value = null
  action()
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

function handleResetGame() {
  askConfirm({
    title: 'Reset',
    message: 'Réinitialiser tous les scores ?',
    confirmLabel: 'Réinitialiser',
    danger: true,
    action: resetGame
  })
}

function handleSaveScore(roundData, score, attack) {
  saveRoundScore(scoringPlayerIndex.value, roundData, score, attack)
  scoringPlayerIndex.value = null
}

function startNewRound() {
  if (players.value.length === 0) return
  const top = [...players.value].sort((a, b) => b.score - a.score)[0]
  askConfirm({
    title: 'Fin de manche',
    message: `${top.name} remporte cette manche !\nDémarrer une nouvelle manche ?`,
    confirmLabel: 'Nouvelle manche',
    action: saveCurrentManche
  })
}
</script>

<template>
  <div class="px-5 pb-32 min-h-screen" style="padding-top: calc(var(--safe-top) + 20px)">
    <h1 class="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
      {{ isVengeance ? 'Flip7 Vengeance' : 'Flip7 Score' }}
    </h1>

    <!-- Game settings -->
    <div class="max-w-xl mx-auto mb-6">
      <div class="flex gap-1 bg-slate-800 rounded-xl p-1">
        <button
          v-for="opt in [{ value: 'classic', label: 'Classique' }, { value: 'vengeance', label: 'Vengeance' }]"
          :key="opt.value"
          @click="setVariant(opt.value)"
          :class="[
            'flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none',
            settings.variant === opt.value ? 'bg-indigo-500 text-white' : 'text-slate-400',
            isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:text-white'
          ]"
        >{{ opt.label }}</button>
      </div>
      <div v-if="isVengeance" class="flex justify-between items-center mt-2 px-1">
        <span class="text-sm text-slate-300">Mode Brutal</span>
        <button
          @click="toggleBrutal"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-bold transition border-none',
            settings.brutal ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400',
            isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
          ]"
        >{{ settings.brutal ? 'Activé' : 'Désactivé' }}</button>
      </div>
      <p v-if="isLocked" class="text-xs text-slate-500 text-center mt-2">
        🔒 Verrouillé pendant la partie
      </p>
    </div>

    <div class="grid gap-4 max-w-xl mx-auto">
      <div v-if="sortedPlayers.length === 0" class="text-center py-10 text-slate-400">
        Ajoutez des joueurs pour commencer...
      </div>
      <PlayerCard
        v-for="{ player, originalIndex } in sortedPlayers"
        :key="player.name"
        :player="player"
        @score="scoringPlayerIndex = originalIndex"
        @remove="handleRemovePlayer(originalIndex)"
      />
    </div>
  </div>

  <!-- Bottom Controls -->
  <div class="fixed bottom-0 left-0 right-0 px-5 py-5 flex justify-center gap-4 z-10"
       style="background: linear-gradient(transparent, #0f172a 20%)">
    <button
      @click="handleResetGame"
      class="border-none rounded-xl px-5 py-3 font-semibold text-base cursor-pointer transition-all inline-flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20"
    >
      Reset
    </button>
    <button
      @click="showRecapModal = true"
      class="border-none rounded-xl px-5 py-3 font-semibold text-base cursor-pointer transition-all inline-flex items-center gap-2 bg-slate-700 text-slate-100 hover:bg-slate-600"
    >
      Récap
    </button>
    <button
      @click="showAddPlayerModal = true"
      class="border-none rounded-xl px-5 py-3 font-semibold text-base cursor-pointer transition-all inline-flex items-center gap-2 bg-slate-700 text-slate-100 hover:bg-slate-600"
    >
      + Joueur
    </button>
    <button
      @click="startNewRound"
      class="border-none rounded-full px-8 py-4 font-semibold text-lg cursor-pointer transition-all inline-flex items-center gap-2 bg-indigo-500 text-white hover:bg-indigo-400 hover:-translate-y-0.5"
      style="box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4)"
    >
      Nouvelle Manche
    </button>
  </div>

  <AddPlayerModal
    v-if="showAddPlayerModal"
    @add="handleAddPlayer"
    @close="showAddPlayerModal = false"
  />
  <ScoringModal
    v-if="scoringPlayerIndex !== null"
    :player="players[scoringPlayerIndex]"
    :variant="settings.variant"
    :brutal="settings.brutal"
    :opponents="opponents"
    @save="handleSaveScore"
    @close="scoringPlayerIndex = null"
  />
  <RecapModal
    v-if="showRecapModal"
    :players="players"
    :manches="manches"
    @close="showRecapModal = false"
  />
  <ConfirmModal
    v-if="confirmState"
    :title="confirmState.title"
    :message="confirmState.message"
    :confirm-label="confirmState.confirmLabel"
    :danger="confirmState.danger"
    @confirm="handleConfirm"
    @cancel="confirmState = null"
  />
  <UpdatePrompt />
</template>
