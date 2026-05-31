/**
 * Generador de números pseudoaleatorios usando el Método Congruencial Mixto.
 * Fórmula: n(i+1) = (a * n(i) + c) mod m
 *          u(i)   = n(i) / m  →  resultado ∈ [0, 1)
 *
 * Parámetros por defecto (período máximo, condiciones de Hull-Dobell):
 *   a = 1664525
 *   c = 1013904223
 *   m = 2^32 = 4294967296
 */

const DEFAULT_A = 1664525;
const DEFAULT_C = 1013904223;
const DEFAULT_M = 4294967296; // 2^32

// Estado interno del generador global
let _seed = BigInt(Date.now());
const _a = BigInt(DEFAULT_A);
const _c = BigInt(DEFAULT_C);
const _m = BigInt(DEFAULT_M);

/**
 * Avanza el estado interno del generador global y devuelve u ∈ [0, 1).
 * Cada llamada produce un valor distinto.
 *
 * @returns {number} Número pseudoaleatorio en el intervalo [0, 1).
 */
export function nextRandom() {
  _seed = (_a * _seed + _c) % _m;
  return Number(_seed) / DEFAULT_M;
}

/**
 * Reinicia la semilla del generador global.
 * Si no se proporciona un valor, usa Date.now().
 *
 * @param {number} [seed] - Semilla opcional. Debe ser un entero no negativo.
 */
export function resetSeed(seed) {
  _seed = BigInt(seed !== undefined ? seed : Date.now());
}

/**
 * Devuelve la semilla actual del generador global como número entero.
 *
 * @returns {number} Semilla actual.
 */
export function getCurrentSeed() {
  return Number(_seed);
}

/**
 * Genera un entero pseudoaleatorio entre min y max, ambos inclusive,
 * usando el generador global.
 *
 * @param {number} min - Límite inferior (inclusive).
 * @param {number} max - Límite superior (inclusive).
 * @returns {number} Entero pseudoaleatorio en [min, max].
 */
export function nextRandomInt(min, max) {
  return Math.floor(nextRandom() * (max - min + 1)) + min;
}

/**
 * Crea un generador independiente con su propio estado interno.
 * Útil para tener múltiples streams de números aleatorios sin interferencia.
 *
 * @param {object} [options={}] - Opciones de configuración.
 * @param {number} [options.seed]  - Semilla inicial. Por defecto: Date.now().
 * @param {number} [options.a=1664525]     - Multiplicador.
 * @param {number} [options.c=1013904223]  - Incremento.
 * @param {number} [options.m=4294967296]  - Módulo (2^32).
 * @returns {{ next: () => number, nextInt: (min: number, max: number) => number, reset: (seed?: number) => void }} Objeto generador.
 */
export function createGenerator({ seed, a = DEFAULT_A, c = DEFAULT_C, m = DEFAULT_M } = {}) {
  let state = BigInt(seed !== undefined ? seed : Date.now());
  const bigA = BigInt(a);
  const bigC = BigInt(c);
  const bigM = BigInt(m);

  /**
   * Avanza el estado y devuelve u ∈ [0, 1).
   *
   * @returns {number} Número pseudoaleatorio en [0, 1).
   */
  function next() {
    state = (bigA * state + bigC) % bigM;
    return Number(state) / m;
  }

  /**
   * Genera un entero pseudoaleatorio entre min y max, ambos inclusive.
   *
   * @param {number} min - Límite inferior (inclusive).
   * @param {number} max - Límite superior (inclusive).
   * @returns {number} Entero pseudoaleatorio en [min, max].
   */
  function nextInt(min, max) {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  /**
   * Reinicia la semilla del generador.
   * Si no se proporciona un valor, usa Date.now().
   *
   * @param {number} [newSeed] - Semilla opcional.
   */
  function reset(newSeed) {
    state = BigInt(newSeed !== undefined ? newSeed : Date.now());
  }

  return { next, nextInt, reset };
}
