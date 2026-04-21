import { ref, watch } from 'vue'

const STORAGE_KEY = 'flip7_master_data'

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  if (!saved) return { players: [], manches: [] }
  // Migration : ancien format = tableau de joueurs
  if (Array.isArray(saved)) return { players: saved, manches: [] }
  return { players: saved.players ?? [], manches: saved.manches ?? [] }
}

export function usePlayers() {
  const { players: savedPlayers, manches: savedManches } = loadState()
  const players = ref(savedPlayers)
  const manches = ref(savedManches)

  watch([players, manches], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players: players.value,
      manches: manches.value
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
      timestamp: Date.now()
    })
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

  return { players, manches, addPlayer, removePlayer, resetGame, saveCurrentManche, saveRoundScore }
}
