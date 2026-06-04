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

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * --------------------------------------------------------------------------
 * function exponentialRandom(nextU, ex)  → líneas 20 a 27
 * --------------------------------------------------------------------------
 * Esta función devuelve UN tiempo entre eventos siguiendo la distribución
 * Exponencial, usando el método de la transformada inversa.
 *
 * Línea 20  → export function exponentialRandom(nextU, ex) {
 *   Declara y exporta la función. Recibe dos parámetros:
 *     - nextU: una FUNCIÓN que, al invocarla, devuelve el próximo número
 *              pseudoaleatorio u ∈ [0, 1) (proviene del generador MCM).
 *     - ex:    el valor esperado E(X) (la media de la distribución).
 *   La palabra "export" permite que otros archivos la importen y la usen.
 *
 * Línea 22  → let u = nextU()
 *   Invoca a la función nextU() para obtener el primer número aleatorio u
 *   y lo guarda en la variable "u". Aquí se INVOCA nextU (el generador).
 *
 * Línea 23  → while (u === 0) {
 *   Comprueba si u es exactamente 0. Si lo es, entra al bucle, porque
 *   ln(0) no está definido matemáticamente (tiende a -∞) y rompería el cálculo.
 *
 * Línea 24  → u = nextU()
 *   Dentro del bucle, vuelve a INVOCAR nextU() para pedir otro número
 *   aleatorio y reemplaza el valor de u. Se repite hasta que u ≠ 0.
 *
 * Línea 25  → }
 *   Cierra el bucle while.
 *
 * Línea 26  → return -ex * Math.log(u)
 *   Aplica la fórmula de la transformada inversa: tiempo = -E(X) * ln(u).
 *   - Math.log(u) → INVOCA la función logaritmo natural (ln) de JavaScript.
 *   - Se multiplica por -ex para obtener el tiempo final.
 *   El "return" devuelve ese tiempo a quien haya llamado a la función.
 *
 * Línea 27  → }
 *   Cierra la función exponentialRandom.
 *
 * =============================================================================
 */
