<script setup>
import { onMounted, onUnmounted } from 'vue'
import { isCalcOperator } from '../scoring.js'

// Clavier calculatrice : l'expression est une chaîne, ex. « 12+3×2 »
const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const KEYS = [
  '7', '8', '9', '÷',
  '4', '5', '6', '×',
  '1', '2', '3', '−',
  'C', '0', '⌫', '+'
]

const MAX_LENGTH = 24

function press(key) {
  let v = props.modelValue
  if (key === 'C') v = ''
  else if (key === '⌫') v = v.slice(0, -1)
  else if (isCalcOperator(key)) {
    if (v === '') {
      if (key === '−') v = '−' // score négatif
    } else if (v !== '−') {
      // Deux opérateurs de suite : le dernier remplace le précédent
      v = isCalcOperator(v.at(-1)) ? v.slice(0, -1) + key : v + key
    }
  } else {
    // Pas de zéro inutile en tête d'un nombre (« 05 » → « 5 »)
    v = /(^|[+−×÷])0$/.test(v) ? v.slice(0, -1) + key : v + key
  }
  if (v.length > MAX_LENGTH) return
  emit('update:modelValue', v)
}

// Saisie au clavier physique (ordinateur)
const KEYBOARD = { '*': '×', x: '×', '/': '÷', '-': '−', '+': '+', Backspace: '⌫', Delete: 'C' }

function onKeydown(e) {
  if (/^\d$/.test(e.key)) press(e.key)
  else if (e.key === 'Enter') emit('submit')
  else if (KEYBOARD[e.key]) press(KEYBOARD[e.key])
  else return
  e.preventDefault()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="grid grid-cols-4 gap-1.5">
    <button
      v-for="key in KEYS"
      :key="key"
      @click="press(key)"
      :class="[
        'h-12 rounded-xl font-bold text-xl transition border-none cursor-pointer select-none',
        isCalcOperator(key)
          ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
          : key === 'C' || key === '⌫'
            ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            : 'bg-slate-700 text-white hover:bg-slate-600'
      ]"
    >{{ key }}</button>
  </div>
</template>
