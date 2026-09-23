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

// --- Calculatrice du score direct ---

export const CALC_OPERATORS = ['+', '−', '×', '÷']
export const isCalcOperator = c => CALC_OPERATORS.includes(c)

// Évalue « 12+3×2−5 » (× et ÷ prioritaires, « − » en tête = négatif) sans eval().
// Un opérateur final est ignoré. Résultat arrondi à l'entier inférieur ; null si vide ou division par zéro.
export function evaluateExpression(expr) {
  const tokens = expr.replace(/[+−×÷]$/, '').match(/\d+|[+−×÷]/g)
  if (!tokens) return null
  const sign = tokens[0] === '−' ? -1 : 1
  if (sign === -1) tokens.shift()
  if (tokens.length === 0) return null

  const terms = [sign * Number(tokens[0])]
  const addOps = []
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const n = Number(tokens[i + 1])
    if (op === '×') terms.push(terms.pop() * n)
    else if (op === '÷') {
      if (n === 0) return null
      terms.push(terms.pop() / n)
    } else {
      addOps.push(op)
      terms.push(n)
    }
  }
  const value = addOps.reduce((acc, op, i) => (op === '+' ? acc + terms[i + 1] : acc - terms[i + 1]), terms[0])
  // Epsilon : évite 9.999999 → 9 après une division
  return Math.floor(value + 1e-9)
}

// --- Totaux et manches (communs à tous les jeux) ---

// Les attaques reçues ne comptent pas comme une manche jouée
export const isPlayed = r => r.type !== 'attack'

// Le total est toujours recalculé depuis les rounds, jamais stocké
export const playerTotal = player => sum(player.rounds.map(r => r.score))

// { [manche]: score } — attaques incluses dans la manche de l'attaquant
export function mancheScores(player) {
  const out = {}
  for (const r of player.rounds) out[r.manche] = (out[r.manche] ?? 0) + r.score
  return out
}

export function currentManche(players) {
  return Math.max(0, ...players.flatMap(p => p.rounds.map(r => r.manche)))
}

const hasPlayed = (player, n) => player.rounds.some(r => isPlayed(r) && r.manche === n)

// Première manche non jouée par ce joueur (comble les trous après un effacement)
export function nextMancheFor(player) {
  let n = player.startManche
  while (hasPlayed(player, n)) n++
  return n
}

// Chaque joueur présent à cette manche l'a jouée
export function isMancheComplete(players) {
  const n = currentManche(players)
  if (n === 0) return false
  return players.filter(p => p.startManche <= n).every(p => hasPlayed(p, n))
}

// standings : [{ name, total, … }] → tri + gagnants (ex æquo inclus)
export function rankStandings(standings, lowestWins) {
  const sorted = [...standings].sort((a, b) => lowestWins ? a.total - b.total : b.total - a.total)
  const best = sorted[0]?.total
  return { sorted, winners: sorted.filter(s => s.total === best).map(s => s.name) }
}

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()
