<script setup>
import { ref } from 'vue'

const props = defineProps({
  player: Object
})

defineEmits(['score', 'remove'])

const showHistory = ref(false)
</script>

<template>
  <div
    :class="[
      'fade-in relative overflow-hidden rounded-xl px-4 py-3 shadow-lg border transition-transform',
      player.score >= 200
        ? 'border-amber-400 bg-gradient-to-br from-slate-800 to-amber-950'
        : 'border-white/5 bg-slate-800'
    ]"
  >
    <!-- Left accent bar -->
    <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl"></div>

    <div class="flex justify-between items-center">
      <div class="cursor-pointer" @click="showHistory = !showHistory">
        <h3 class="text-base font-semibold">{{ player.name }} {{ player.score >= 200 ? '👑' : '' }}</h3>
        <p class="text-2xl font-bold text-indigo-400">{{ player.score }}</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('score')"
          class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-sm transition border-none cursor-pointer text-slate-100"
        >
          Points
        </button>
        <button
          @click="$emit('remove')"
          class="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition border-none cursor-pointer text-sm"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- History -->
    <div v-if="showHistory" class="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400">
      <strong class="text-slate-300">Historique :</strong>
      <div v-if="player.rounds.length === 0" class="mt-1">Aucune manche jouée.</div>
      <div
        v-for="(r, i) in player.rounds"
        :key="i"
        class="flex justify-between py-1"
      >
        <span>
          Manche {{ i + 1 }} :
          {{ r.numbers.join(', ') }}
          {{ r.modifiers.map(m => '+' + m).join(' ') }}
          {{ r.hasMultiplier ? 'x2' : '' }}
        </span>
        <span class="text-indigo-400 font-bold">+{{ r.score }}</span>
      </div>
    </div>
  </div>
</template>
