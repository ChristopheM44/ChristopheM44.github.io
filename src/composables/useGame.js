import { ref, computed, watch } from 'vue'
import {
  FLIP7_BONUS, isPlayed, playerTotal, mancheScores, currentManche, nextMancheFor, isMancheComplete, rankStandings
} from '../scoring.js'

const STORAGE_KEY = 'score_master_data'
const VERSION = 2
const LEGACY_KEY = 'flip7_master_data'

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const flip7Name = variant => (variant === 'vengeance' ? 'Flip 7 Vengeance' : 'Flip 7')

// Ancien format Flip 7 : { players: [{ name, score, rounds }], manches, settings } (ou tableau de joueurs).
// Ses « manches » étaient des parties jusqu'à 200 : elles deviennent l'historique.
function migrateLegacy(saved) {
  const data = Array.isArray(saved) ? { players: saved } : saved
  const oldPlayers = data.players ?? []
  const settings = { variant: 'classic', brutal: false, ...data.settings, target: 200, lowestWins: false }

  const players = oldPlayers.map(p => {
    let n = 0
    return {
      name: p.name,
      startManche: 1,
      rounds: (p.rounds ?? []).map(r => (isPlayed(r) ? { ...r, manche: ++n } : { ...r }))
    }
  })
  // Une attaque partage le timestamp du round de l'attaquant : elle prend sa manche
  players.forEach(p => p.rounds.forEach(r => {
    if (isPlayed(r)) return
    const source = players.find(o => o.name === r.from)?.rounds.find(x => isPlayed(x) && x.timestamp === r.timestamp)
    r.manche = source?.manche ?? 1
  }))

  const current = players.length === 0 ? null : {
    id: newId(),
    createdAt: Date.now(),
    game: 'flip7',
    name: flip7Name(settings.variant),
    settings,
    players
  }

  const history = (data.manches ?? []).map(m => ({
    id: newId(),
    createdAt: m.timestamp,
    endedAt: m.timestamp,
    game: 'flip7',
    name: flip7Name(m.variant),
    settings: { variant: m.variant ?? 'classic', brutal: !!m.brutal, target: 200, lowestWins: false },
    winners: m.winner ? [m.winner] : [],
    results: (m.results ?? []).map(r => ({ name: r.name, score: r.score, manches: null }))
  })).reverse()

  return { current, history }
}

function loadState() {
  const saved = readJSON(STORAGE_KEY)
  if (saved?.version === VERSION) return { current: saved.current ?? null, history: saved.history ?? [] }
  const legacy = readJSON(LEGACY_KEY)
  return legacy ? migrateLegacy(legacy) : { current: null, history: [] }
}

function createGame() {
  const saved = loadState()
  const current = ref(saved.current)
  const history = ref(saved.history)

  watch([current, history], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, current: current.value, history: history.value }))
  }, { deep: true })

  const players = computed(() => current.value?.players ?? [])
  const settings = computed(() => current.value?.settings ?? {})

  const standings = computed(() =>
    players.value.map((player, index) => ({ name: player.name, player, index, total: playerTotal(player) }))
  )
  const ranking = computed(() => rankStandings(standings.value, settings.value.lowestWins))
  const manche = computed(() => currentManche(players.value))
  const mancheComplete = computed(() => isMancheComplete(players.value))
  // Manche en cours de saisie
  const playingManche = computed(() => (manche.value === 0 || mancheComplete.value ? manche.value + 1 : manche.value))
  const targetReached = computed(() =>
    settings.value.target != null && standings.value.some(s => s.total >= settings.value.target)
  )

  // --- Parties ---

  function startPartie({ game, name, settings, playerNames }) {
    if (current.value) finishPartie()
    current.value = {
      id: newId(),
      createdAt: Date.now(),
      game,
      name,
      settings,
      players: playerNames.map(name => ({ name, startManche: 1, rounds: [] }))
    }
  }

  // Range la partie dans l'historique (si au moins un score) et renvoie l'id de l'entrée
  function finishPartie() {
    const partie = current.value
    if (!partie) return null
    let id = null
    if (partie.players.some(p => p.rounds.length > 0)) {
      const { id: pid, createdAt, game, name, settings } = partie
      id = pid
      history.value.unshift({
        id, createdAt, endedAt: Date.now(), game, name, settings,
        winners: ranking.value.winners,
        results: standings.value.map(s => ({ name: s.name, score: s.total, manches: mancheScores(s.player) }))
      })
    }
    current.value = null
    return id
  }

  function abandonPartie() {
    current.value = null
  }

  function deletePartie(id) {
    history.value = history.value.filter(p => p.id !== id)
  }

  // --- Joueurs ---

  function addPlayer(name) {
    current.value.players.push({ name, startManche: playingManche.value, rounds: [] })
  }

  function removePlayer(index) {
    current.value.players.splice(index, 1)
  }

  // --- Scores ---

  // Retire le round joué à cette manche et l'attaque qui lui est liée
  function removeRound(player, n) {
    const round = player.rounds.find(r => isPlayed(r) && r.manche === n)
    if (!round) return
    player.rounds = player.rounds.filter(r => r !== round)
    if (round.attackTarget) {
      const target = current.value.players.find(p => p.name === round.attackTarget)
      if (target) {
        target.rounds = target.rounds.filter(r => !(r.type === 'attack' && r.from === player.name && r.timestamp === round.timestamp))
      }
    }
  }

  // Tous les jeux : un joueur à la fois. Une manche déjà jouée est remplacée.
  function saveRoundScore(playerIndex, roundData, score, attack = null, n = null) {
    const all = current.value.players
    const player = all[playerIndex]
    const m = n ?? nextMancheFor(player)
    removeRound(player, m)
    const timestamp = Date.now()
    player.rounds.push({
      score,
      manche: m,
      timestamp,
      ...roundData,
      ...(attack ? { attackTarget: all[attack.targetIndex].name } : {})
    })
    player.rounds.sort((a, b) => a.manche - b.manche)
    if (attack) {
      const target = all[attack.targetIndex]
      target.rounds.push({ type: 'attack', from: player.name, score: -FLIP7_BONUS, manche: m, timestamp })
      target.rounds.sort((a, b) => a.manche - b.manche)
    }
  }

  function deleteRound(playerIndex, n) {
    removeRound(current.value.players[playerIndex], n)
  }

  return {
    current, history, players, settings, standings, ranking, manche, mancheComplete, playingManche, targetReached,
    startPartie, finishPartie, abandonPartie, deletePartie,
    addPlayer, removePlayer, saveRoundScore, deleteRound
  }
}

// Singleton : toutes les vues partagent le même état
let game = null
export function useGame() {
  if (!game) game = createGame()
  return game
}
