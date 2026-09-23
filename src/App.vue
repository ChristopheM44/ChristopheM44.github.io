<script setup>
import { ref, provide } from 'vue'
import { useGame } from './composables/useGame.js'
import HomeView from './views/HomeView.vue'
import SetupView from './views/SetupView.vue'
import GameView from './views/GameView.vue'
import HistoryView from './views/HistoryView.vue'
import ResultView from './views/ResultView.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const { current } = useGame()

const screen = ref(current.value ? 'game' : 'home') // 'home' | 'setup' | 'game' | 'history' | 'result'
const setupType = ref('classic')
// Partie terminée affichée par l'écran résultat, et écran où revenir
const result = ref({ id: null, from: 'home' })

function openSetup(type) {
  setupType.value = type
  screen.value = 'setup'
}

function openResult(id, from) {
  result.value = { id, from }
  screen.value = 'result'
}

// Confirmation intégrée (confirm() est bloqué dans certains navigateurs / PWA)
// options : { title, message, confirmLabel, danger, action, cancelLabel, cancelAction }
const confirmState = ref(null)

provide('askConfirm', options => { confirmState.value = options })

function closeConfirm(key) {
  const fn = confirmState.value[key]
  confirmState.value = null
  fn?.()
}
</script>

<template>
  <GameView v-if="screen === 'game' && current" @home="screen = 'home'" @result="id => openResult(id, 'home')" />
  <SetupView v-else-if="screen === 'setup'" :type="setupType" @back="screen = 'home'" @start="screen = 'game'" />
  <HistoryView v-else-if="screen === 'history'" @back="screen = 'home'" @open="id => openResult(id, 'history')" />
  <ResultView
    v-else-if="screen === 'result'"
    :key="result.id"
    :id="result.id"
    :from="result.from"
    @back="screen = result.from"
    @replay="screen = 'game'"
  />
  <HomeView v-else @resume="screen = 'game'" @setup="openSetup" @history="screen = 'history'" />

  <ConfirmModal
    v-if="confirmState"
    :title="confirmState.title"
    :message="confirmState.message"
    :confirm-label="confirmState.confirmLabel"
    :cancel-label="confirmState.cancelLabel"
    :danger="confirmState.danger"
    @confirm="closeConfirm('action')"
    @cancel="closeConfirm('cancelAction')"
  />
  <UpdatePrompt />
</template>
