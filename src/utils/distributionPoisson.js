/**
 * Distribución de Poisson
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

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * --------------------------------------------------------------------------
 * function poissonRandom(nextU, alpha)  → líneas 24 a 33
 * --------------------------------------------------------------------------
 * Esta función devuelve la CANTIDAD de eventos que ocurren en un continuo
 * (un valor entero no negativo) siguiendo la distribución Poisson(α),
 * mediante el algoritmo de Knuth.
 *
 * Línea 24  → export function poissonRandom(nextU, alpha) {
 *   Declara y exporta la función. Recibe dos parámetros:
 *     - nextU: una FUNCIÓN que, al invocarla, devuelve el próximo número
 *              pseudoaleatorio u ∈ [0, 1) (proviene del generador MCM).
 *     - alpha: la tasa promedio de eventos por continuo (α > 0).
 *   La palabra "export" permite que otros archivos la importen y la usen.
 *
 * Línea 25  → const b = Math.exp(-alpha)
 *   Calcula la cota b = e^(-α). Math.exp() → INVOCA la función exponencial de
 *   JavaScript (e elevado a un número). Este valor es el umbral con el que se
 *   compara el producto acumulado de los números aleatorios.
 *
 * Línea 26  → let x = 0
 *   Inicializa en 0 el contador "x", que cuenta cuántos números aleatorios
 *   se fueron generando (terminará siendo la cantidad de eventos).
 *
 * Línea 27  → let p = 1
 *   Inicializa en 1 la variable "p", el producto acumulado de los números
 *   aleatorios. Empieza en 1 porque es el elemento neutro de la multiplicación.
 *
 * Línea 28  → while (p > b) {
 *   Bucle que se repite mientras el producto acumulado "p" siga siendo mayor
 *   que la cota "b". Cuando p caiga por debajo de b, el bucle termina.
 *
 * Línea 29  → p = p * nextU()
 *   INVOCA nextU() para obtener un nuevo número aleatorio u ∈ [0, 1) y lo
 *   multiplica por "p", actualizando el producto acumulado. Como u < 1, "p"
 *   siempre disminuye en cada vuelta, garantizando que el bucle termine.
 *
 * Línea 30  → x = x + 1
 *   Incrementa en 1 el contador "x" por cada número aleatorio generado.
 *
 * Línea 31  → }
 *   Cierra el bucle while.
 *
 * Línea 32  → return x - 1
 *   Devuelve x - 1. Se resta 1 porque la última iteración (la que hizo que
 *   p ≤ b) no corresponde a un evento; este ajuste hace que el valor esperado
 *   sea E[X] = α. El "return" entrega el resultado a quien llamó a la función.
 *
 * Línea 33  → }
 *   Cierra la función poissonRandom.
 *
 * =============================================================================
 */
