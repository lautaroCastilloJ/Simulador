/**
 * Distribución Multinomial — selección de categoría por transformada inversa
 *
 * Genera un único número uniforme u ∈ [0, 1) y lo compara contra las
 * probabilidades acumuladas F(X) de cada categoría. Devuelve la primera
 * categoría cuyo límite acumulado supera a u.
 *
 * Lógica de decisión (ejemplo con 4 categorías, prob. [0.35, 0.40, 0.15, 0.10]):
 *   u < 0.35              → categoría 0
 *   u < 0.75              → categoría 1
 *   u < 0.90              → categoría 2
 *   u ≥ 0.90 (resto)      → categoría 3
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

