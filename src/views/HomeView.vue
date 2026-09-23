<script setup>
import { computed, inject } from 'vue'
import { useGame } from '../composables/useGame.js'

const emit = defineEmits(['resume', 'setup', 'history'])
const askConfirm = inject('askConfirm')

const { current, history, playingManche, abandonPartie } = useGame()

const GAME_TYPES = [
  { type: 'classic', label: 'Flip 7', hint: 'Classique' },
  { type: 'vengeance', label: 'Flip 7 Vengeance', hint: 'Mode Brutal possible' },
  { type: 'generic', label: 'Autre jeu', hint: 'Skyjo, …' }
]

const currentInfo = computed(() => {
  if (!current.value) return ''
  return `Manche ${playingManche.value} · ${current.value.players.map(p => p.name).join(', ')}`
})

function handleAbandon() {
  askConfirm({
    title: 'Abandonner la partie',
    message: `Supprimer définitivement « ${current.value.name} » et tous ses scores ? Elle ne sera pas ajoutée à l'historique.`,
    confirmLabel: 'Abandonner',
    danger: true,
    action: abandonPartie
  })
}
</script>

<template>
  <div class="px-5 pb-10 min-h-screen" style="padding-top: calc(var(--safe-top) + 20px)">
    <div class="max-w-xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
        Score Master
      </h1>

      <!-- Partie en cours -->
      <div v-if="current" class="fade-in relative overflow-hidden rounded-xl px-4 py-4 mb-8 shadow-lg border border-indigo-500/40 bg-slate-800">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Partie en cours</div>
        <div class="text-xl font-bold">{{ current.name }}</div>
        <div class="text-sm text-slate-400 mb-3 truncate">{{ currentInfo }}</div>
        <div class="flex gap-2">
          <button
            @click="$emit('resume')"
            class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer bg-indigo-500 text-white hover:bg-indigo-400"
          >Reprendre</button>
          <button
            @click="handleAbandon"
            class="px-4 py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >Abandonner</button>
        </div>
      </div>

      <!-- Nouvelle partie -->
      <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Nouvelle partie</div>
      <div class="grid gap-2 mb-8">
        <button
          v-for="g in GAME_TYPES"
          :key="g.type"
          @click="$emit('setup', g.type)"
          class="flex justify-between items-center px-4 py-3.5 rounded-xl transition border-none cursor-pointer bg-slate-800 hover:bg-slate-700 text-left text-slate-100"
        >
          <span>
            <span class="block font-semibold">{{ g.label }}</span>
            <span class="block text-xs text-slate-400">{{ g.hint }}</span>
          </span>
          <span class="text-slate-500 text-lg">›</span>
        </button>
      </div>

      <!-- Historique -->
      <button
        @click="$emit('history')"
        class="w-full flex justify-between items-center px-4 py-3.5 rounded-xl transition border-none cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-100"
      >
        <span class="font-semibold">Historique des parties</span>
        <span class="text-sm text-slate-400">{{ history.length }} ›</span>
      </button>
    </div>
  </div>
</template>
