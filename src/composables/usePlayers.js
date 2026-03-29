import { ref, watch } from 'vue'

const STORAGE_KEY = 'flip7_master_data'

export function usePlayers() {
  const players = ref(JSON.parse(localStorage.getItem(STORAGE_KEY)) || [])

  watch(players, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
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
  }

  function saveRoundScore(playerIndex, roundData, score) {
    players.value[playerIndex].score += score
    players.value[playerIndex].rounds.push({
      score,
      timestamp: Date.now(),
      ...roundData
    })
  }

  return { players, addPlayer, removePlayer, resetGame, saveRoundScore }
}
