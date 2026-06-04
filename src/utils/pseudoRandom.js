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

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * IDEA GENERAL
 * ------------
 * Este archivo implementa el Método Congruencial Mixto (MCM), que produce
 * números pseudoaleatorios con la fórmula de recurrencia:
 *      n(i+1) = (a * n(i) + c) mod m
 *      u(i)   = n(i) / m        →  un número real en el intervalo [0, 1)
 * "Pseudoaleatorio" significa que NO son verdaderamente al azar: a partir de
 * una misma semilla siempre sale la misma secuencia (esto da reproducibilidad).
 *
 * ¿Por qué BigInt? Porque a * n(i) puede dar números enormes (mayores que los
 * que JavaScript maneja con seguridad como Number: 2^53). BigInt permite operar
 * con enteros gigantes sin perder precisión; al final se convierte a Number.
 *
 * ##########################################################################
 * CONSTANTES Y ESTADO GLOBAL  → líneas 12 a 20
 * ##########################################################################
 *
 * Línea 12  → const DEFAULT_A = 1664525;
 *   Multiplicador "a" por defecto. Es una constante recomendada que, junto con
 *   c y m, cumple las condiciones de Hull-Dobell para lograr período máximo
 *   (recorrer todos los valores posibles antes de repetir la secuencia).
 *
 * Línea 13  → const DEFAULT_C = 1013904223;
 *   Incremento "c" por defecto. Al ser distinto de 0, el método es "mixto"
 *   (si fuera 0 sería "multiplicativo").
 *
 * Línea 14  → const DEFAULT_M = 4294967296; // 2^32
 *   Módulo "m" por defecto, igual a 2^32. Es el divisor del "mod" y define el
 *   rango de los números generados (de 0 a m-1) y el período máximo posible.
 *
 * Línea 17  → let _seed = BigInt(Date.now());
 *   Estado interno del generador GLOBAL (el que comparten nextRandom, resetSeed,
 *   etc.). Se inicializa con la hora actual en milisegundos: Date.now() INVOCA
 *   el reloj del sistema y BigInt() lo convierte a entero grande. El guion bajo
 *   "_" es una convención para indicar que es una variable "privada" del módulo.
 *
 * Líneas 18-20 → const _a/_c/_m = BigInt(DEFAULT_A/_C/_M);
 *   Convierten las constantes a BigInt una sola vez, para usarlas directamente
 *   en la fórmula sin reconvertir en cada llamada.
 *
 * ##########################################################################
 * function nextRandom()  → líneas 28 a 31
 * ##########################################################################
 * Avanza el generador GLOBAL y devuelve el siguiente u ∈ [0, 1).
 *
 * Línea 28  → export function nextRandom() {
 *   Declara y exporta la función (sin parámetros).
 * Línea 29  → _seed = (_a * _seed + _c) % _m;
 *   Aplica la fórmula del MCM: multiplica el estado por _a, suma _c y toma el
 *   resto de dividir por _m (operador %). El resultado se guarda como NUEVO
 *   estado, de modo que la próxima llamada parta de aquí.
 * Línea 30  → return Number(_seed) / DEFAULT_M;
 *   Convierte el estado (BigInt) a Number y lo divide por m para "normalizarlo"
 *   al rango [0, 1). Devuelve ese u.
 * Línea 31  → }  Cierra la función.
 *
 * ##########################################################################
 * function resetSeed(seed)  → líneas 39 a 41
 * ##########################################################################
 * Reinicia la semilla del generador GLOBAL (sirve para reproducir secuencias).
 *
 * Línea 39  → export function resetSeed(seed) {
 *   Declara y exporta la función. Recibe "seed" (opcional).
 * Línea 40  → _seed = BigInt(seed !== undefined ? seed : Date.now());
 *   Operador ternario: si se pasó una semilla la usa; si no (undefined), INVOCA
 *   Date.now(). El resultado se convierte a BigInt y reemplaza el estado global.
 * Línea 41  → }  Cierra la función.
 *
 * ##########################################################################
 * function getCurrentSeed()  → líneas 48 a 50
 * ##########################################################################
 * Devuelve el estado/semilla actual del generador global como Number.
 *
 * Línea 48  → export function getCurrentSeed() {  Declara y exporta la función.
 * Línea 49  → return Number(_seed);
 *   Convierte el estado interno (BigInt) a Number y lo devuelve. Útil para
 *   conocer/guardar la semilla actual.
 * Línea 50  → }  Cierra la función.
 *
 * ##########################################################################
 * function nextRandomInt(min, max)  → líneas 60 a 62
 * ##########################################################################
 * Devuelve un ENTERO pseudoaleatorio entre min y max (ambos inclusive).
 *
 * Línea 60  → export function nextRandomInt(min, max) {
 *   Declara y exporta la función. Recibe el rango deseado [min, max].
 * Línea 61  → return Math.floor(nextRandom() * (max - min + 1)) + min;
 *   - nextRandom() → INVOCA el generador global para obtener u ∈ [0, 1).
 *   - (max - min + 1) es la cantidad de enteros posibles del rango.
 *   - Al multiplicar u por esa cantidad se obtiene un real dentro del rango.
 *   - Math.floor() → INVOCA el redondeo hacia abajo para quedarse con el entero.
 *   - Sumar "min" traslada el resultado para que empiece en el límite inferior.
 * Línea 62  → }  Cierra la función.
 *
 * ##########################################################################
 * function createGenerator({ seed, a, c, m })  → líneas 75 a 113
 * ##########################################################################
 * Crea un generador INDEPENDIENTE, con su propio estado, separado del global.
 * Así se pueden tener varios "streams" de números que no se interfieren entre sí.
 * Es el que usa la simulación (plantSimulation.js) para ser reproducible.
 *
 * Línea 75  → export function createGenerator({ seed, a = DEFAULT_A, c = DEFAULT_C, m = DEFAULT_M } = {}) {
 *   Declara y exporta la función. Recibe un objeto de opciones por
 *   desestructuración: si no se pasan a/c/m usa los valores por defecto, y el
 *   "= {}" final permite invocarla sin argumentos.
 *
 * Línea 76  → let state = BigInt(seed !== undefined ? seed : Date.now());
 *   Estado interno PROPIO de este generador. Ternario: usa la semilla recibida
 *   o, si no hay, INVOCA Date.now(). Se guarda como BigInt.
 * Líneas 77-79 → const bigA/bigC/bigM = BigInt(a/c/m);
 *   Convierte los parámetros a BigInt una sola vez para la fórmula.
 *
 * --- function next()  → líneas 86 a 89 ---
 *   Es la función que realmente genera cada número de ESTE generador.
 * Línea 86  → function next() {  Declara la función interna (closure).
 * Línea 87  → state = (bigA * state + bigC) % bigM;
 *   Aplica el MCM sobre el estado propio y lo actualiza (igual que la línea 29
 *   pero usando las variables locales de este generador).
 * Línea 88  → return Number(state) / m;
 *   Normaliza el estado a [0, 1) dividiéndolo por m y lo devuelve.
 * Línea 89  → }  Cierra next.
 *
 * --- function nextInt(min, max)  → líneas 98 a 100 ---
 * Línea 98  → function nextInt(min, max) {  Declara la función interna.
 * Línea 99  → return Math.floor(next() * (max - min + 1)) + min;
 *   Igual que nextRandomInt, pero INVOCA el next() local de este generador para
 *   producir un entero en [min, max].
 * Línea 100 → }  Cierra nextInt.
 *
 * --- function reset(newSeed)  → líneas 108 a 110 ---
 * Línea 108 → function reset(newSeed) {  Declara la función interna.
 * Línea 109 → state = BigInt(newSeed !== undefined ? newSeed : Date.now());
 *   Reinicia el estado propio con la nueva semilla (o Date.now() si no se pasa).
 * Línea 110 → }  Cierra reset.
 *
 * Línea 112 → return { next, nextInt, reset };
 *   Devuelve un OBJETO con las tres funciones internas. Gracias al "closure",
 *   estas funciones siguen accediendo a la variable "state" privada de esta
 *   instancia. Por eso cada generador creado mantiene su secuencia por separado.
 * Línea 113 → }  Cierra createGenerator.
 *
 * =============================================================================
 */
