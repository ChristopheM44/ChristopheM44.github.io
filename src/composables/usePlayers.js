import { ref, computed, watch } from 'vue'
import { FLIP7_BONUS } from '../scoring.js'

const STORAGE_KEY = 'flip7_master_data'
const DEFAULT_SETTINGS = { variant: 'classic', brutal: false }

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  if (!saved) return { players: [], manches: [], settings: { ...DEFAULT_SETTINGS } }
  // Migration : ancien format = tableau de joueurs
  if (Array.isArray(saved)) return { players: saved, manches: [], settings: { ...DEFAULT_SETTINGS } }
  return {
    players: saved.players ?? [],
    manches: saved.manches ?? [],
    settings: { ...DEFAULT_SETTINGS, ...saved.settings }
  }
}

export function usePlayers() {
  const { players: savedPlayers, manches: savedManches, settings: savedSettings } = loadState()
  const players = ref(savedPlayers)
  const manches = ref(savedManches)
  const settings = ref(savedSettings)

  const isLocked = computed(() => players.value.some(p => p.rounds.length > 0))

  watch([players, manches, settings], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players: players.value,
      manches: manches.value,
      settings: settings.value
    }))
  }, { deep: true })

  function addPlayer(name) {
    players.value.push({ name, score: 0, rounds: [] })
  }

  function removePlayer(index) {
    players.value.splice(index, 1)
  }

  function resetGame() {
    players.value.forEach(p => {
      p.score = 0
      p.rounds = []
    })
    manches.value = []
  }

  function saveCurrentManche() {
    const sorted = [...players.value].sort((a, b) => b.score - a.score)
    manches.value.push({
      winner: sorted[0].name,
      results: players.value.map(p => ({ name: p.name, score: p.score })),
      variant: settings.value.variant,
      brutal: settings.value.brutal,
      timestamp: Date.now()
    })
    players.value.forEach(p => {
      p.score = 0
      p.rounds = []
    })
  }

  function saveRoundScore(playerIndex, roundData, score, attack = null) {
    const player = players.value[playerIndex]
    const timestamp = Date.now()
    player.score += score
    player.rounds.push({
      score,
      timestamp,
      ...roundData,
      ...(attack ? { attackTarget: players.value[attack.targetIndex].name } : {})
    })
    if (attack) {
      const target = players.value[attack.targetIndex]
      target.score -= FLIP7_BONUS
      target.rounds.push({ type: 'attack', from: player.name, score: -FLIP7_BONUS, timestamp })
    }
  }

  return { players, manches, settings, isLocked, addPlayer, removePlayer, resetGame, saveCurrentManche, saveRoundScore }
}
