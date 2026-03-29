<script setup>
import { ref, computed } from 'vue'
import { usePlayers } from './composables/usePlayers.js'
import PlayerCard from './components/PlayerCard.vue'
import AddPlayerModal from './components/AddPlayerModal.vue'
import ScoringModal from './components/ScoringModal.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'

const { players, addPlayer, removePlayer, resetGame, saveRoundScore } = usePlayers()

const sortedPlayers = computed(() =>
  [...players.value]
    .map((p, i) => ({ player: p, originalIndex: i }))
    .sort((a, b) => b.player.score - a.player.score)
)

const showAddPlayerModal = ref(false)
const scoringPlayerIndex = ref(null)

function handleAddPlayer(name) {
  addPlayer(name)
  showAddPlayerModal.value = false
}

function handleRemovePlayer(index) {
  if (confirm(`Supprimer ${players.value[index].name} ?`)) {
    removePlayer(index)
  }
}

function handleResetGame() {
  if (confirm('Réinitialiser tous les scores ?')) {
    resetGame()
  }
}

function handleSaveScore(roundData, score) {
  saveRoundScore(scoringPlayerIndex.value, roundData, score)
  scoringPlayerIndex.value = null
}

function startNewRound() {
  alert('Saisissez les scores de chaque joueur pour cette manche.')
}
</script>

<template>
  <div class="px-5 pb-32 min-h-screen" style="padding-top: calc(var(--safe-top) + 20px)">
    <h1 class="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
      Flip7 Score
    </h1>

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
    @save="handleSaveScore"
    @close="scoringPlayerIndex = null"
  />
  <UpdatePrompt />
</template>
