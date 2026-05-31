/**
 * Distribución Exponencial
 *
 * Genera un tiempo entre eventos a partir del método de la transformada inversa.
 *
 * Fórmula:
 *   tiempo = -E(X) * ln(u)    ← u es el número pseudoaleatorio u ∈ (0, 1)
 *
 * donde E(X) es el valor esperado de la variable (en nuestro caso, el
 * tiempo promedio). Equivale a E(X) = 1 / λ, siendo λ la tasa de eventos.
 */

/**
 * Genera un tiempo con distribución Exponencial de media E(X).
 *
 * @param {() => number} nextU - Función que devuelve u ∈ [0, 1) del generador MCM.
 * @param {number} ex          - Valor esperado E(X) (media), debe ser > 0.
 * @returns {number} Tiempo real no negativo. Valor esperado E[X] = ex.
 */
export function exponentialRandom(nextU, ex) {
  // Se descarta u = 0 porque ln(0) no está definido (→ -∞).
  let u = nextU()
  while (u === 0) {
    u = nextU()
  }
  return -ex * Math.log(u)
}

/**
 * Valor esperado teórico de la distribución Exponencial de media E(X).
 *
 * @param {number} ex - Valor esperado E(X).
 * @returns {number} E[X] = ex
 */
export function exponentialMean(ex) {
  return ex
}

/**
 * Varianza teórica de la distribución Exponencial de media E(X).
 *
 * @param {number} ex - Valor esperado E(X).
 * @returns {number} Var[X] = ex^2
 */
export function exponentialVariance(ex) {
  return ex ** 2
}
