<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: Array,
  manches: Array
})
const emit = defineEmits(['close'])

const playerNames = computed(() => props.players.map(p => p.name))

function winCount(name) {
  return props.manches.filter(m => m.winner === name).length
}

const sortedManches = computed(() => [...props.manches].reverse())
</script>

<template>
  <div class="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-end justify-center">
    <div class="bg-slate-800 w-full max-w-lg rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl max-h-[92vh] flex flex-col">

      <!-- Handle bar -->
      <div class="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 shrink-0"></div>

      <!-- Header -->
      <div class="flex justify-between items-center mb-4 shrink-0">
        <span class="text-lg font-bold">Récap des manches</span>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition border-none cursor-pointer text-white text-sm"
        >✕</button>
      </div>

      <!-- Win counts -->
      <div class="flex flex-wrap gap-2 mb-4 shrink-0">
        <div
          v-for="name in playerNames"
          :key="name"
          class="flex items-center gap-1.5 bg-slate-700 rounded-lg px-3 py-1.5"
        >
          <span class="font-semibold text-sm text-slate-200">{{ name }}</span>
          <span class="text-amber-400 font-bold text-sm">{{ winCount(name) }} 🏆</span>
        </div>
      </div>

      <!-- No manches -->
      <div v-if="manches.length === 0" class="text-center text-slate-400 py-12">
        Aucune manche terminée.
      </div>

      <!-- Manche list -->
      <div v-else class="overflow-y-auto flex-1 space-y-3">
        <div
          v-for="(manche, i) in sortedManches"
          :key="manche.timestamp"
          class="bg-slate-700/50 rounded-xl px-4 py-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Manche {{ manches.length - i }}
            </span>
            <span class="text-amber-400 font-bold text-sm">👑 {{ manche.winner }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="result in manche.results"
              :key="result.name"
              :class="[
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm',
                result.name === manche.winner
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-700 text-slate-300'
              ]"
            >
              <span class="font-medium">{{ result.name }}</span>
              <span class="font-bold">{{ result.score }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
