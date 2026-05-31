// Prueba de la distribución de Poisson con el MCM.
// Ejecutar: node poissonTest.js

// ── MCM (Método Congruencial Mixto) ─────────────────────────
const MCM_A = 1664525n
const MCM_C = 1013904223n
const MCM_M = 4294967296n   // 2^32

let seed = 12345n

function GU() {
  seed = (MCM_A * seed + MCM_C) % MCM_M
  return Number(seed) / Number(MCM_M)   // u ∈ [0, 1)
}

// ── PROC. POISSON (a) ────────────────────────────────────────
// a  : cantidad de eventos por continuo (α)
// b  : e^(-a)
// x  : contador de iteraciones (cantidad de u consumidos)
// Retorna x - 1 para que E[X] = a  (ajuste del algoritmo de Knuth)
function poisson(a) {
  const b = Math.exp(-a)
  let x = 0
  let p = 1
  while (p > b) {
    const u = GU()
    p = p * u
    x = x + 1
  }
  return x - 1
}

// ── Prueba ───────────────────────────────────────────────────
const ALPHA = 3
const N     = 1000

const valores = Array.from({ length: N }, () => poisson(ALPHA))

// Media
const media = valores.reduce((s, v) => s + v, 0) / N

// Frecuencia absoluta por valor
const freq = {}
for (const v of valores) freq[v] = (freq[v] ?? 0) + 1

// ── Salida ───────────────────────────────────────────────────
console.log(`\nPoissonTest — α = ${ALPHA}  |  n = ${N}`)
console.log(`${'─'.repeat(40)}`)
console.log(`Media obtenida : ${media.toFixed(4)}`)
console.log(`Media esperada : ${ALPHA}`)
console.log(`${'─'.repeat(40)}`)
console.log(`\nPrimeros 30 valores:`)
console.log(valores.slice(0, 30).join('  '))
console.log(`\nFrecuencia absoluta:`)
Object.keys(freq).sort((a, b) => +a - +b).forEach(k => {
  const bar = '█'.repeat(Math.round(freq[k] / N * 80))
  console.log(`  x=${k.padStart(2)}  ${String(freq[k]).padStart(4)}  ${bar}`)
})
