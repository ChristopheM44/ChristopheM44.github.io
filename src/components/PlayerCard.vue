<script setup>
import { ref, computed } from 'vue'
import { formatSigned } from '../scoring.js'

const props = defineProps({
  player: Object,
  total: Number,
  leader: { type: Boolean, default: false }
})

defineEmits(['score', 'remove'])

const showHistory = ref(false)

// Les attaques reçues n'ont pas de libellé de manche
const history = computed(() =>
  props.player.rounds.map(r => ({ ...r, label: r.type === 'attack' ? null : r.manche }))
)

function describe(r) {
  if (r.type === 'attack') return `Flip 7 de ${r.from}`
  if (r.direct) return r.attackTarget ? `Score direct · −15 à ${r.attackTarget}` : 'Score direct'
  const parts = []
  if (r.isBusted) parts.push('Bust')
  if (!r.isBusted && r.numbers?.length) parts.push(r.numbers.join(', '))
  if (r.modifiers?.length) parts.push(r.modifiers.map(m => '+' + m).join(' '))
  if (r.hasMultiplier) parts.push('x2')
  if (r.half) parts.push('÷2')
  if (r.minus?.length) parts.push(r.minus.map(m => '−' + m).join(' '))
  if (r.attackTarget) parts.push(`· Flip 7 → −15 à ${r.attackTarget}`)
  return parts.join(' ')
}
</script>

<template>
  <div
    :class="[
      'fade-in relative overflow-hidden rounded-xl px-4 py-3 shadow-lg border transition-transform',
      leader
        ? 'border-amber-400 bg-gradient-to-br from-slate-800 to-amber-950'
        : 'border-white/5 bg-slate-800'
    ]"
  >
    <!-- Left accent bar -->
    <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl"></div>

    <div class="flex justify-between items-center">
      <div class="cursor-pointer" @click="showHistory = !showHistory">
        <h3 class="text-base font-semibold">{{ player.name }} {{ leader ? '👑' : '' }}</h3>
        <p :class="['text-2xl font-bold', total < 0 ? 'text-red-400' : 'text-indigo-400']">{{ total }}</p>
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
        v-for="(r, i) in history"
        :key="i"
        class="flex justify-between py-1"
      >
        <span :class="r.type === 'attack' ? 'text-red-400' : ''">
          <template v-if="r.label">Manche {{ r.label }}{{ describe(r) ? ' : ' : '' }}</template>{{ describe(r) }}
        </span>
        <span :class="['font-bold', r.score < 0 ? 'text-red-400' : 'text-indigo-400']">{{ formatSigned(r.score) }}</span>
      </div>
    </div>
  </div>
</template>
