<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  player: Object
})
const emit = defineEmits(['save', 'close'])

const mode = ref('cards') // 'cards' | 'direct'
const directScore = ref(null)

const numbers = ref([])
const modifiers = ref([])
const hasMultiplier = ref(false)

const CARD_VALUES = Array.from({ length: 13 }, (_, i) => i) // 0-12
const MODIFIER_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10]

const uniqueNumbers = computed(() => new Set(numbers.value))
const isBusted = computed(() => numbers.value.length - uniqueNumbers.value.size > 0)
const hasFlip7 = computed(() => uniqueNumbers.value.size >= 7 && !isBusted.value)

const cardScore = computed(() => {
  if (isBusted.value) return 0
  let numSum = numbers.value.reduce((a, b) => a + b, 0)
  if (hasMultiplier.value) numSum *= 2
  const modSum = modifiers.value.reduce((a, b) => a + b, 0)
  return numSum + modSum + (hasFlip7.value ? 15 : 0)
})

const roundScore = computed(() =>
  mode.value === 'direct' ? (directScore.value ?? 0) : cardScore.value
)

function getCardCount(val) {
  return numbers.value.filter(n => n === val).length
}

function toggleNumber(val) {
  const index = numbers.value.indexOf(val)
  if (index > -1) {
    numbers.value.splice(index, 1)
  } else {
    numbers.value.push(val)
  }
}

function toggleModifier(val) {
  const index = modifiers.value.indexOf(val)
  if (index > -1) {
    modifiers.value.splice(index, 1)
  } else {
    modifiers.value.push(val)
  }
}

function saveScore() {
  if (mode.value === 'direct') {
    emit('save', { numbers: [], modifiers: [], hasMultiplier: false, isBusted: false, hasFlip7: false }, roundScore.value)
  } else {
    emit('save', {
      numbers: numbers.value,
      modifiers: modifiers.value,
      hasMultiplier: hasMultiplier.value,
      isBusted: isBusted.value,
      hasFlip7: hasFlip7.value
    }, roundScore.value)
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-end justify-center">
    <div class="bg-slate-800 w-full max-w-lg rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl max-h-[92vh] overflow-y-auto">

      <!-- Handle bar -->
      <div class="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4"></div>

      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <span class="text-lg font-bold">{{ player.name }}</span>
        <div class="flex items-center gap-3">
          <span
            :class="[
              'text-2xl font-extrabold',
              isBusted ? 'text-red-400' : hasFlip7 ? 'text-amber-400' : 'text-indigo-400'
            ]"
          >{{ roundScore }}</span>
          <button
            @click="$emit('close')"
            class="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition border-none cursor-pointer text-white text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Mode toggle -->
      <div class="flex gap-1 bg-slate-700 rounded-xl p-1 mb-4">
        <button
          @click="mode = 'cards'"
          :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer', mode === 'cards' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white']"
        >Cartes</button>
        <button
          @click="mode = 'direct'"
          :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer', mode === 'direct' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white']"
        >Score direct</button>
      </div>

      <!-- Direct score input -->
      <div v-if="mode === 'direct'" class="mb-4">
        <input
          v-model.number="directScore"
          type="number"
          placeholder="Score du tour"
          class="w-full bg-slate-700 text-white text-center text-3xl font-bold rounded-xl py-4 border-2 border-slate-600 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <!-- Status badges -->
      <div class="flex gap-2 mb-4" v-if="hasFlip7 || isBusted">
        <div v-if="hasFlip7" class="flex-1 text-center bg-amber-500/10 border border-amber-400 px-3 py-1.5 rounded-lg">
          <span class="text-amber-400 font-bold text-sm">✨ FLIP 7 +15</span>
        </div>
        <div v-if="isBusted" class="flex-1 text-center bg-red-500/10 border border-red-500 px-3 py-1.5 rounded-lg">
          <span class="text-red-400 font-bold text-sm">💥 BUST — 0 pts</span>
        </div>
      </div>

      <!-- Number Cards -->
      <template v-if="mode === 'cards'">
      <div class="mb-4">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Cartes</div>
        <div class="grid grid-cols-7 gap-1.5">
          <button
            v-for="val in CARD_VALUES"
            :key="val"
            @click="toggleNumber(val)"
            :class="[
              'aspect-square rounded-lg border-2 font-bold text-base transition-all cursor-pointer border-none',
              getCardCount(val) > 1
                ? 'bg-red-500 text-white'
                : getCardCount(val) === 1
                  ? 'bg-indigo-500 text-white scale-105'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
            ]"
          >
            {{ val }}
          </button>
        </div>
      </div>

      <!-- Modifiers -->
      <div class="mb-4">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Modificateurs</div>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="val in MODIFIER_VALUES"
            :key="val"
            @click="toggleModifier(val)"
            :class="[
              'py-2 rounded-lg font-semibold text-sm transition-all border-none cursor-pointer',
              modifiers.includes(val) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
            ]"
          >
            +{{ val }}
          </button>
        </div>
      </div>

      <!-- Multiplier -->
      <div class="mb-5">
        <button
          @click="hasMultiplier = !hasMultiplier"
          :class="[
            'w-full py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer',
            hasMultiplier ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          ]"
        >
          {{ hasMultiplier ? '✓ Multiplicateur x2 actif' : 'Multiplicateur x2' }}
        </button>
      </div>
      </template>

      <!-- Validate -->
      <button
        @click="saveScore"
        class="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-semibold text-base transition border-none cursor-pointer text-white"
      >
        Valider
      </button>
    </div>
  </div>
</template>
