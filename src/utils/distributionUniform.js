
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






