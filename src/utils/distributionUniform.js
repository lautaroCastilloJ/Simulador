/**
 * Distribución Uniforme continua U(a, b)
 *
 * Genera un valor real distribuido uniformemente en el intervalo [a, b).
 *
 * Fórmula:
 *   x = a + (b - a) * u    ← u es el número pseudoaleatorio u ∈ [0, 1)
 */

/**
 * Genera un valor real con distribución Uniforme(a, b).
 *
 * @param {() => number} nextU - Función que devuelve u ∈ [0, 1) del generador MCM.
 * @param {number} a           - Límite inferior del intervalo.
 * @param {number} b           - Límite superior del intervalo (b > a).
 * @returns {number} Valor real en [a, b). Valor esperado E[X] = (a + b) / 2.
 */
export function uniformRandom(nextU, a, b) {
  return a + (b - a) * nextU()
}

/**
 * Valor esperado teórico de la distribución Uniforme(a, b).
 *
 * @param {number} a - Límite inferior del intervalo.
 * @param {number} b - Límite superior del intervalo.
 * @returns {number} E[X] = (a + b) / 2
 */
export function uniformMean(a, b) {
  return (a + b) / 2
}

/**
 * Varianza teórica de la distribución Uniforme(a, b).
 *
 * @param {number} a - Límite inferior del intervalo.
 * @param {number} b - Límite superior del intervalo.
 * @returns {number} Var[X] = (b - a)^2 / 12
 */
export function uniformVariance(a, b) {
  return ((b - a) ** 2) / 12
}
