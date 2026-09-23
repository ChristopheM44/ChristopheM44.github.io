export const CLASSIC_CARDS = Array.from({ length: 13 }, (_, i) => i) // 0-12
export const CLASSIC_MODIFIERS = [2, 3, 4, 5, 6, 7, 8, 9, 10]
export const VENGEANCE_CARDS = Array.from({ length: 14 }, (_, i) => i) // 0-13
export const MINUS_VALUES = [2, 4, 6, 8, 10]
export const FLIP7_BONUS = 15

const sum = arr => arr.reduce((a, b) => a + b, 0)

export function scoreClassic({ numbers, modifiers, hasMultiplier, isBusted }) {
  const hasFlip7 = !isBusted && new Set(numbers).size >= 7
  if (isBusted) return { score: 0, hasFlip7 }
  let numSum = sum(numbers)
  if (hasMultiplier) numSum *= 2
  return { score: numSum + sum(modifiers) + (hasFlip7 ? FLIP7_BONUS : 0), hasFlip7 }
}

// Ordre officiel : somme → ÷2 (arrondi bas) → malus → plancher 0 (hors Brutal) → +15
export function scoreVengeance({ numbers, minus, half, isBusted, flip7Choice }, { brutal }) {
  if (isBusted) return { score: brutal ? -sum(minus) : 0, hasFlip7: false }
  const hasFlip7 = numbers.length >= 7
  // Zéro : la main vaut 0 sauf Flip 7 (en Brutal, les malus s'appliquent ensuite)
  let n = numbers.includes(0) && !hasFlip7 ? 0 : sum(numbers)
  if (half) n = Math.floor(n / 2)
  n -= sum(minus)
  if (!brutal) n = Math.max(0, n)
  if (hasFlip7 && flip7Choice !== 'attack') n += FLIP7_BONUS
  return { score: n, hasFlip7 }
}

export function formatSigned(n) {
  return n < 0 ? `−${-n}` : `+${n}`
}
