
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






/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * 
 *
 * Distribución Uniforme continua U(a, b)
 *
 * Genera un valor real distribuido uniformemente en el intervalo [a, b).
 *
 * Fórmula:
 *   x = a + (b - a) * u    ← u es el número pseudoaleatorio u ∈ [0, 1)
 *

 * --------------------------------------------------------------------------
 * function uniformRandom(nextU, a, b)  → líneas 18 a 20
 * --------------------------------------------------------------------------
 * Esta función devuelve UN valor real distribuido uniformemente dentro del
 * intervalo [a, b), usando el método de la transformada inversa.
 *
 * Línea 18  → export function uniformRandom(nextU, a, b) {
 *   Declara y exporta la función. Recibe tres parámetros:
 *     - nextU: una FUNCIÓN que, al invocarla, devuelve el próximo número
 *              pseudoaleatorio u ∈ [0, 1) (proviene del generador MCM).
 *     - a:     el límite inferior del intervalo.
 *     - b:     el límite superior del intervalo (debe cumplir b > a).
 *   La palabra "export" permite que otros archivos la importen y la usen.
 *
 * Línea 19  → return a + (b - a) * nextU()
 *   Aplica la fórmula de la Uniforme: x = a + (b - a) * u.
 *   - nextU() → INVOCA al generador para obtener el número aleatorio u ∈ [0, 1).
 *   - (b - a) es la amplitud del intervalo; al multiplicarla por u (que está
 *     entre 0 y 1) se obtiene un desplazamiento dentro de ese rango.
 *   - Sumar "a" traslada ese desplazamiento para que arranque en el límite
 *     inferior, dando un valor final dentro de [a, b).
 *   El "return" devuelve ese valor a quien haya llamado a la función.
 *
 * Línea 20  → }
 *   Cierra la función uniformRandom.
 *
 * =============================================================================
 */
