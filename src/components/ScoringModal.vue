<script setup>
import { ref, computed } from 'vue'
import {
  CLASSIC_CARDS, CLASSIC_MODIFIERS, VENGEANCE_CARDS, MINUS_VALUES, FLIP7_BONUS,
  scoreClassic, scoreVengeance, evaluateExpression
} from '../scoring.js'
import ScoreKeypad from './ScoreKeypad.vue'

const props = defineProps({
  player: Object,
  variant: { type: String, default: 'classic' },
  brutal: { type: Boolean, default: false },
  opponents: { type: Array, default: () => [] },
  manche: Number,
  // Correction d'une manche déjà saisie : score initial + bouton Effacer
  editing: { type: Boolean, default: false },
  initialScore: { type: Number, default: null }
})
const emit = defineEmits(['save', 'delete', 'close'])

const isGeneric = props.variant === 'generic'
const isVengeance = computed(() => props.variant === 'vengeance')
const canAttack = computed(() => isVengeance.value && props.brutal && props.opponents.length > 0)
const negativesAllowed = isGeneric || props.brutal

const mode = ref(isGeneric || props.editing ? 'direct' : 'cards') // 'cards' | 'direct'
// Score direct : expression saisie au clavier calculatrice, ex. « 12+3×2 »
const directExpr = ref(props.initialScore != null ? String(props.initialScore).replace('-', '−') : '')
const directAttack = ref(false)
const directHasOperator = computed(() => /[+×÷]|.−/.test(directExpr.value))
const directInvalid = computed(() => directExpr.value !== '' && directExpr.value !== '−' && evaluateExpression(directExpr.value) === null)

const numbers = ref([])
const isBusted = ref(false)
// Classique
const modifiers = ref([])
const hasMultiplier = ref(false)
// Vengeance
const minus = ref([])
const half = ref(false)
const flip7Choice = ref('self') // 'self' | 'attack'
const attackTarget = ref(null)

const CARD_VALUES = computed(() => isVengeance.value ? VENGEANCE_CARDS : CLASSIC_CARDS)

const result = computed(() =>
  isVengeance.value
    ? scoreVengeance(
        { numbers: numbers.value, minus: minus.value, half: half.value, isBusted: isBusted.value, flip7Choice: canAttack.value ? flip7Choice.value : 'self' },
        { brutal: props.brutal }
      )
    : scoreClassic({ numbers: numbers.value, modifiers: modifiers.value, hasMultiplier: hasMultiplier.value, isBusted: isBusted.value })
)
const hasFlip7 = computed(() => result.value.hasFlip7)
const hasZero = computed(() => isVengeance.value && numbers.value.includes(0))

const isAttacking = computed(() =>
  canAttack.value && (mode.value === 'direct' ? directAttack.value : hasFlip7.value && flip7Choice.value === 'attack')
)

const directScore = computed(() => evaluateExpression(directExpr.value) ?? 0)

const roundScore = computed(() =>
  mode.value === 'direct' ? directScore.value : result.value.score
)

const canSave = computed(() => {
  if (isAttacking.value && attackTarget.value === null) return false
  if (mode.value === 'direct' && (directInvalid.value || (!negativesAllowed && roundScore.value < 0))) return false
  return true
})

// Détail du calcul Vengeance, ex. « 49 ÷2 = 24 − 6 = 18 »
const breakdown = computed(() => {
  if (!isVengeance.value || isBusted.value || numbers.value.length === 0) return ''
  const total = numbers.value.reduce((a, b) => a + b, 0)
  let n = hasZero.value && !hasFlip7.value ? 0 : total
  let text = `${total}`
  if (n !== total) text += ' → Zéro = 0'
  if (half.value) {
    n = Math.floor(n / 2)
    text += ` ÷2 = ${n}`
  }
  if (minus.value.length) {
    n -= minus.value.reduce((a, b) => a + b, 0)
    text += ` ${minus.value.map(m => `− ${m}`).join(' ')} = ${n}`
  }
  if (!props.brutal && n < 0) text += ' → 0'
  if (hasFlip7.value && !isAttacking.value) text += ` + ${FLIP7_BONUS}`
  return `${text} → ${result.value.score}`
})

function getCardCount(val) {
  return numbers.value.filter(n => n === val).length
}

function toggleNumber(val) {
  const count = getCardCount(val)
  // Lucky 13 : vide → 13 → 13 ×2 → vide
  if (isVengeance.value && val === 13 && count === 1) {
    numbers.value.push(13)
  } else if (count > 0) {
    numbers.value = numbers.value.filter(n => n !== val)
  } else {
    numbers.value.push(val)
  }
}

// `list` est le tableau réactif (le template déballe les refs)
function toggleIn(list, val) {
  const index = list.indexOf(val)
  if (index > -1) list.splice(index, 1)
  else list.push(val)
}

function unlucky7() {
  numbers.value = [7]
  minus.value = []
  half.value = false
}

const modifiersLocked = computed(() => isBusted.value && !(isVengeance.value && props.brutal))

function saveScore() {
  if (!canSave.value) return
  const attack = isAttacking.value ? { targetIndex: attackTarget.value } : null
  if (isGeneric) {
    emit('save', {}, roundScore.value)
  } else if (mode.value === 'direct') {
    emit('save', { variant: props.variant, direct: true, numbers: [], modifiers: [], hasMultiplier: false, isBusted: false, hasFlip7: !!attack }, roundScore.value, attack)
  } else if (isVengeance.value) {
    emit('save', {
      variant: 'vengeance',
      numbers: numbers.value,
      minus: minus.value,
      half: half.value,
      isBusted: isBusted.value,
      hasFlip7: hasFlip7.value,
      flip7Choice: hasFlip7.value ? (attack ? 'attack' : 'self') : null
    }, roundScore.value, attack)
  } else {
    emit('save', {
      variant: 'classic',
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
        <span>
          <span class="block text-lg font-bold leading-tight">{{ player.name }}</span>
          <span v-if="manche" class="block text-xs text-slate-400">Manche {{ manche }}{{ editing ? ' · correction' : '' }}</span>
        </span>
        <div class="flex items-center gap-3">
          <span
            :class="[
              'text-2xl font-extrabold',
              isBusted || roundScore < 0 ? 'text-red-400' : hasFlip7 ? 'text-amber-400' : 'text-indigo-400'
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
      <div v-if="!isGeneric" class="flex gap-1 bg-slate-700 rounded-xl p-1 mb-4">
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
        <!-- Écran de la calculatrice -->
        <div class="bg-slate-900/60 border-2 border-slate-600 rounded-xl px-4 py-3 mb-2 text-right">
          <div :class="['text-3xl font-bold break-all leading-tight', directExpr ? 'text-white' : 'text-slate-500']">{{ directExpr || '0' }}</div>
          <div class="text-sm h-5 text-slate-400">
            <template v-if="directInvalid">Division par zéro</template>
            <template v-else-if="directHasOperator">= {{ directScore }}</template>
          </div>
        </div>
        <ScoreKeypad v-model="directExpr" @submit="saveScore" />
        <p v-if="!negativesAllowed && roundScore < 0" class="text-xs text-red-400 mt-2 text-center">
          Score négatif possible uniquement en mode Brutal.
        </p>
        <button
          v-if="canAttack"
          @click="directAttack = !directAttack"
          :class="[
            'w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer',
            directAttack ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          ]"
        >
          {{ directAttack ? '✓ Flip 7 → −15 à un adversaire' : 'Flip 7 → −15 à un adversaire' }}
        </button>
      </div>

      <template v-if="mode === 'cards'">
        <!-- Status badges -->
        <div class="flex gap-2 mb-4" v-if="hasFlip7 || isBusted">
          <div v-if="hasFlip7" class="flex-1 text-center bg-amber-500/10 border border-amber-400 px-3 py-1.5 rounded-lg">
            <span class="text-amber-400 font-bold text-sm">✨ FLIP 7 {{ isAttacking ? '−15 adversaire' : '+15' }}</span>
          </div>
          <div v-if="isBusted" class="flex-1 text-center bg-red-500/10 border border-red-500 px-3 py-1.5 rounded-lg">
            <span class="text-red-400 font-bold text-sm">💥 BUST — {{ roundScore }} pts</span>
          </div>
        </div>

        <!-- Number Cards -->
        <div class="mb-4">
          <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Cartes</div>
          <div :class="['grid grid-cols-7 gap-1.5 transition-opacity', isBusted ? 'opacity-40 pointer-events-none' : '']">
            <button
              v-for="val in CARD_VALUES"
              :key="val"
              @click="toggleNumber(val)"
              :class="[
                'aspect-square rounded-lg font-bold text-base transition-all cursor-pointer border-none',
                getCardCount(val) > 1
                  ? 'bg-amber-500 text-slate-900 scale-105'
                  : getCardCount(val) === 1
                    ? (isVengeance && val === 0 ? 'bg-amber-500 text-slate-900 scale-105' : 'bg-indigo-500 text-white scale-105')
                    : (isVengeance && val === 0 ? 'bg-slate-700 hover:bg-slate-600 text-amber-400' : 'bg-slate-700 hover:bg-slate-600 text-white')
              ]"
            >
              {{ getCardCount(val) > 1 ? `${val}×2` : val }}
            </button>
          </div>
          <p v-if="isVengeance" class="text-xs text-slate-500 mt-2">
            Appuyez deux fois sur 13 pour le Lucky 13.
          </p>
        </div>

        <div v-if="hasZero && !hasFlip7 && !isBusted" class="mb-4 text-center bg-amber-500/10 border border-amber-400 px-3 py-1.5 rounded-lg">
          <span class="text-amber-400 font-semibold text-sm">Zéro : 0 pt sauf Flip 7</span>
        </div>

        <!-- Special actions -->
        <div class="flex gap-2 mb-4">
          <button
            v-if="isVengeance"
            @click="unlucky7"
            :disabled="isBusted"
            class="flex-1 py-2 rounded-lg font-semibold text-sm transition border-none cursor-pointer bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40"
          >Unlucky 7</button>
          <button
            @click="isBusted = !isBusted"
            :class="[
              'flex-1 py-2 rounded-lg font-semibold text-sm transition border-none cursor-pointer',
              isBusted ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            ]"
          >{{ isBusted ? '✓ Bust' : 'Bust' }}</button>
        </div>

        <!-- Modifiers -->
        <div :class="['mb-4 transition-opacity', modifiersLocked ? 'opacity-40 pointer-events-none' : '']">
          <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">
            Modificateurs<span v-if="isBusted && !modifiersLocked"> reçus</span>
          </div>
          <div v-if="isVengeance" class="grid grid-cols-5 gap-1.5">
            <button
              v-for="val in MINUS_VALUES"
              :key="val"
              @click="toggleIn(minus, val)"
              :class="[
                'py-2 rounded-lg font-semibold text-sm transition-all border-none cursor-pointer',
                minus.includes(val) ? 'bg-red-500 text-white' : 'bg-slate-700 text-red-300 hover:bg-slate-600'
              ]"
            >
              −{{ val }}
            </button>
          </div>
          <div v-else class="grid grid-cols-5 gap-1.5">
            <button
              v-for="val in CLASSIC_MODIFIERS"
              :key="val"
              @click="toggleIn(modifiers, val)"
              :class="[
                'py-2 rounded-lg font-semibold text-sm transition-all border-none cursor-pointer',
                modifiers.includes(val) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
              ]"
            >
              +{{ val }}
            </button>
          </div>
        </div>

        <!-- Multiplier / Divider -->
        <div :class="['mb-4', isBusted ? 'opacity-40 pointer-events-none' : '']">
          <button
            v-if="isVengeance"
            @click="half = !half"
            :class="[
              'w-full py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer',
              half ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
            ]"
          >
            {{ half ? '✓ Diviseur ÷2 actif (arrondi bas)' : 'Diviseur ÷2' }}
          </button>
          <button
            v-else
            @click="hasMultiplier = !hasMultiplier"
            :class="[
              'w-full py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer',
              hasMultiplier ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
            ]"
          >
            {{ hasMultiplier ? '✓ Multiplicateur x2 actif' : 'Multiplicateur x2' }}
          </button>
        </div>

        <p v-if="breakdown" class="text-sm text-slate-400 font-mono text-center mb-4">{{ breakdown }}</p>

        <!-- Brutal Flip 7 choice -->
        <div v-if="canAttack && hasFlip7" class="mb-4">
          <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Bonus Flip 7</div>
          <div class="flex gap-1 bg-slate-700 rounded-xl p-1">
            <button
              @click="flip7Choice = 'self'"
              :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer', flip7Choice === 'self' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white']"
            >+15 pour moi</button>
            <button
              @click="flip7Choice = 'attack'"
              :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer', flip7Choice === 'attack' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white']"
            >−15 à un adversaire</button>
          </div>
        </div>
      </template>

      <!-- Attack target -->
      <div v-if="isAttacking" class="mb-4">
        <div class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Cible</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in opponents"
            :key="o.index"
            @click="attackTarget = o.index"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-semibold transition border-none cursor-pointer',
              attackTarget === o.index ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
            ]"
          >{{ o.name }}</button>
        </div>
      </div>

      <!-- Validate -->
      <div class="flex gap-2">
        <button
          v-if="editing"
          @click="$emit('delete')"
          class="px-4 py-3 rounded-xl font-semibold text-base transition border-none cursor-pointer bg-red-500/10 text-red-400 hover:bg-red-500/20"
        >Effacer</button>
        <button
          @click="saveScore"
          :disabled="!canSave"
          class="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-semibold text-base transition border-none cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ isAttacking && attackTarget === null ? 'Choisissez une cible' : 'Valider' }}
        </button>
      </div>
    </div>
  </div>
</template>
