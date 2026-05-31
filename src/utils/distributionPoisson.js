/**
 * Distribución de Poisson — Algoritmo de Knuth
 *
 * Genera la cantidad de eventos que ocurren en un continuo
 * dado que la tasa promedio es α (eventos por continuo).
 *
 * Pseudocódigo:
 *   b = e^(-α)
 *   x = 0,  p = 1
 *   while p > b:
 *     u = GU()      ← número pseudoaleatorio u ∈ [0, 1)
 *     p = p * u
 *     x = x + 1
 *   return x - 1    ← ajuste para que E[X] = α
 */

/**
 * Genera un valor entero no negativo con distribución Poisson(α).
 *
 * @param {() => number} nextU - Función que devuelve u ∈ [0, 1) del generador MCM.
 * @param {number} alpha       - Tasa de eventos por continuo (α > 0).
 * @returns {number} Entero no negativo. Valor esperado E[X] = α.
 */
export function poissonRandom(nextU, alpha) {
  const b = Math.exp(-alpha)
  let x = 0
  let p = 1
  while (p > b) {
    p = p * nextU()
    x = x + 1
  }
  return x - 1
}

/**
 * Valor esperado teórico de la distribución Poisson(α).
 *
 * @param {number} alpha - Tasa de eventos por continuo.
 * @returns {number} E[X] = α
 */
export function poissonMean(alpha) {
  return alpha
}

/**
 * Varianza teórica de la distribución Poisson(α).
 *
 * @param {number} alpha - Tasa de eventos por continuo.
 * @returns {number} Var[X] = α
 */
export function poissonVariance(alpha) {
  return alpha
}
