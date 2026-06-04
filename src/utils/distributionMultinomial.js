/**
 * Distribución Multinomial — selección de categoría por transformada inversa
 *
 * Genera un único número uniforme u ∈ [0, 1) y lo compara contra las
 * probabilidades acumuladas F(X) de cada categoría. Devuelve la primera
 * categoría cuyo límite acumulado supera a u.
 *
 * Lógica de decisión (ejemplo con 4 categorías):
 *   u < 0.35              → categoría 0
 *   u < 0.75              → categoría 1
 *   u < 0.85              → categoría 2
 *   u ≥ 0.85 (resto)      → categoría 3
 */

/**
 * Clasifica en una categoría según un vector de probabilidades.
 *
 * @param {() => number} nextU       - Función que devuelve u ∈ [0, 1) del generador MCM.
 * @param {number[]} probabilities   - Probabilidades de cada categoría (deben sumar 1).
 * @returns {{ index: number, u: number }} Índice de categoría elegida y el u utilizado.
 */
export function multinomialPick(nextU, probabilities) {
  const u = nextU()
  let acumulada = 0
  for (let i = 0; i < probabilities.length; i++) {
    acumulada += probabilities[i]
    if (u < acumulada) {
      return { index: i, u }
    }
  }
  // Si u cae justo en el porcentaje teorico, devuelve la última.
  return { index: probabilities.length - 1, u }
}

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * --------------------------------------------------------------------------
 * function multinomialPick(nextU, probabilities)  → líneas 22 a 33
 * --------------------------------------------------------------------------
 * Esta función elige UNA categoría según un vector de probabilidades, usando
 * el método de la transformada inversa sobre las probabilidades acumuladas.
 *
 * Línea 22  → export function multinomialPick(nextU, probabilities) {
 *   Declara y exporta la función. Recibe dos parámetros:
 *     - nextU:         una FUNCIÓN que, al invocarla, devuelve el próximo
 *                      número pseudoaleatorio u ∈ [0, 1) (generador MCM).
 *     - probabilities: un ARREGLO con la probabilidad de cada categoría
 *                      (deben sumar 1; por ejemplo [0.35, 0.40, 0.10, 0.15]).
 *   La palabra "export" permite que otros archivos la importen y la usen.
 *
 * Línea 23  → const u = nextU()
 *   INVOCA a la función nextU() para obtener un único número aleatorio u
 *   y lo guarda en la constante "u". Ese u será comparado contra las
 *   probabilidades acumuladas. Aquí se INVOCA nextU (el generador).
 *
 * Línea 24  → let acumulada = 0
 *   Inicializa en 0 la variable "acumulada", que irá sumando las
 *   probabilidades una a una para construir la frecuencia acumulada F(X).
 *
 * Línea 25  → for (let i = 0; i < probabilities.length; i++) {
 *   Bucle que recorre el arreglo de probabilidades desde la primera (i = 0)
 *   hasta la última. probabilities.length devuelve la cantidad de categorías.
 *   En cada vuelta, "i" es el índice de la categoría actual.
 *
 * Línea 26  → acumulada += probabilities[i]
 *   Suma a "acumulada" la probabilidad de la categoría actual probabilities[i].
 *   Así "acumulada" representa el límite superior del tramo de esta categoría
 *   (la probabilidad acumulada hasta i inclusive).
 *
 * Línea 27  → if (u < acumulada) {
 *   Compara el número aleatorio u contra el límite acumulado. Si u cae dentro
 *   del tramo de esta categoría (es menor que el acumulado), fue seleccionada.
 *
 * Línea 28  → return { index: i, u }
 *   Devuelve un objeto con el índice "i" de la categoría elegida y el "u"
 *   utilizado. El "return" corta la función: no se siguen revisando categorías.
 *
 * Línea 29  → }
 *   Cierra el bloque del if.
 *
 * Línea 30  → }
 *   Cierra el bucle for. Si u no cayó en ningún tramo, el bucle termina sin
 *   haber retornado nada (caso de borde por redondeo de los decimales).
 *
 * Línea 32  → return { index: probabilities.length - 1, u }
 *   Red de seguridad: si por errores de redondeo la suma de probabilidades
 *   no llegó a superar a u, devuelve la ÚLTIMA categoría
 *   (índice probabilities.length - 1) junto con el u utilizado.
 *
 * Línea 33  → }
 *   Cierra la función multinomialPick.
 *
 * =============================================================================
 */
