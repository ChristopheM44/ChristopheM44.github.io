<script setup>
import { ref, computed, inject } from 'vue'
import { useGame } from '../composables/useGame.js'
import { sameName } from '../scoring.js'

const props = defineProps({
  type: { type: String, default: 'classic' } // 'classic' | 'vengeance' | 'generic'
})
const emit = defineEmits(['back', 'start'])
const askConfirm = inject('askConfirm')

const { current, history, startPartie } = useGame()

const isGeneric = props.type === 'generic'
const title = { classic: 'Flip 7', vengeance: 'Flip 7 Vengeance', generic: 'Autre jeu' }[props.type]

const BUILTIN_PRESETS = [{ name: 'Skyjo', target: 100, lowestWins: true }]

// Préréglages : Skyjo + les jeux génériques déjà joués
const presets = computed(() => {
  const list = [...BUILTIN_PRESETS]
  history.value
    .filter(p => p.game === 'generic')
    .forEach(p => {
      if (!list.some(x => sameName(x.name, p.name))) {
        list.push({ name: p.name, target: p.settings.target, lowestWins: p.settings.lowestWins })
      }
    })
  return list
})

const name = ref(isGeneric ? '' : title)
const brutal = ref(false)
const target = ref(isGeneric ? '' : '200')
const lowestWins = ref(false)

function applyPreset(p) {
  name.value = p.name
  target.value = p.target != null ? String(p.target) : ''
  lowestWins.value = p.lowestWins
}

// Joueurs pré-remplis avec ceux de la partie en cours ou de la dernière partie
const lastPlayers = current.value?.players ?? history.value[0]?.results ?? []
const playerNames = ref(lastPlayers.map(p => p.name))
const newName = ref('')

const isDuplicate = computed(() => playerNames.value.some(n => sameName(n, newName.value)))

function addName() {
  const n = newName.value.trim()
  if (!n || isDuplicate.value) return
  playerNames.value.push(n)
  newName.value = ''
}

function removeName(i) {
  playerNames.value.splice(i, 1)
}

const parsedTarget = computed(() => {
  const n = parseInt(target.value, 10)
  return Number.isNaN(n) ? null : n
})

const canStart = computed(() => name.value.trim() !== '' && playerNames.value.length > 0)

function start() {
  if (!canStart.value) return
  const launch = () => {
    startPartie({
      game: isGeneric ? 'generic' : 'flip7',
      name: name.value.trim(),
      settings: {
        variant: isGeneric ? null : props.type,
        brutal: props.type === 'vengeance' && brutal.value,
        target: parsedTarget.value,
        lowestWins: isGeneric && lowestWins.value
      },
      playerNames: playerNames.value
    })
    emit('start')
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
  <div class="px-5 pb-10 min-h-screen" style="padding-top: calc(var(--safe-top) + 12px)">
    <div class="max-w-xl mx-auto">
      <button
        @click="$emit('back')"
        class="px-3 py-1.5 mb-3 rounded-lg text-sm font-semibold transition border-none cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
      >← Accueil</button>

      <h1 class="text-3xl font-bold text-center mb-1 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
        Nouvelle partie
      </h1>
      <p class="text-center text-sm text-slate-400 mb-6">{{ title }}</p>

      <!-- Nom du jeu -->
      <div v-if="isGeneric" class="mb-5">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Nom du jeu</div>
        <input
          v-model="name"
          placeholder="Ex. Skyjo"
          class="w-full px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 border-none outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="p in presets"
            :key="p.name"
            @click="applyPreset(p)"
            class="px-3 py-1 rounded-lg text-xs font-semibold transition border-none cursor-pointer bg-slate-700 text-slate-200 hover:bg-slate-600"
          >{{ p.name }}</button>
        </div>
      </div>

      <!-- Mode Brutal -->
      <div v-if="type === 'vengeance'" class="flex justify-between items-center mb-5 bg-slate-800 rounded-xl px-4 py-3">
        <span class="text-sm text-slate-300">Mode Brutal</span>
        <button
          @click="brutal = !brutal"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-bold transition border-none cursor-pointer',
            brutal ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'
          ]"
        >{{ brutal ? 'Activé' : 'Désactivé' }}</button>
      </div>

      <!-- Score de fin -->
      <div class="mb-5">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Score de fin de partie</div>
        <input
          v-model="target"
          type="text"
          inputmode="numeric"
          placeholder="Aucune limite"
          class="w-full px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 border-none outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p class="text-xs text-slate-500 mt-1">La partie se termine à la fin de la manche où un joueur atteint ce score.</p>
      </div>

      <!-- Gagnant -->
      <div v-if="isGeneric" class="mb-5">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Gagnant</div>
        <div class="flex gap-1 bg-slate-800 rounded-xl p-1">
          <button
            v-for="opt in [{ value: false, label: 'Plus grand score' }, { value: true, label: 'Plus petit score' }]"
            :key="opt.label"
            @click="lowestWins = opt.value"
            :class="[
              'flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer',
              lowestWins === opt.value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            ]"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Joueurs -->
      <div class="mb-6">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Joueurs</div>
        <div class="grid gap-1.5 mb-2">
          <div
            v-for="(n, i) in playerNames"
            :key="n"
            class="flex justify-between items-center bg-slate-800 rounded-xl px-4 py-2"
          >
            <span class="font-semibold">{{ n }}</span>
            <button
              @click="removeName(i)"
              class="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition border-none cursor-pointer text-xs"
            >✕</button>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newName"
            @keypress.enter="addName"
            placeholder="Nom du joueur"
            :class="[
              'flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 border-none outline-none focus:ring-2',
              isDuplicate ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'
            ]"
          />
          <button
            @click="addName"
            :disabled="!newName.trim() || isDuplicate"
            class="px-4 rounded-xl font-semibold transition border-none cursor-pointer bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >Ajouter</button>
        </div>
        <p v-if="isDuplicate" class="text-sm text-red-400 mt-1">Ce nom est déjà utilisé.</p>
      </div>

      <button
        @click="start"
        :disabled="!canStart"
        class="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-semibold text-lg transition border-none cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style="box-shadow: 0 10px 25px -5px rgba(99,102,241,0.4)"
      >Commencer</button>
      <p v-if="!canStart" class="text-xs text-slate-500 text-center mt-2">
        {{ !name.trim() ? 'Donnez un nom au jeu.' : 'Ajoutez au moins un joueur.' }}
      </p>
    </div>
  </div>
</template>
