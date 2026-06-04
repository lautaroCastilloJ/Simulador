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

/**
 * Crea un generador con su propio estado interno. Cada llamada a next()
 * avanza el estado y devuelve un nuevo u ∈ [0, 1). A partir de la misma
 * semilla se obtiene siempre la misma secuencia (reproducibilidad).
 *
 * @param {object} [options={}] - Opciones de configuración.
 * @param {number} [options.seed]         - Semilla inicial. Por defecto: Date.now().
 * @param {number} [options.a=1664525]    - Multiplicador.
 * @param {number} [options.c=1013904223] - Incremento.
 * @param {number} [options.m=4294967296] - Módulo (2^32).
 * @returns {{ next: () => number }} Objeto generador con el método next().
 */
export function createGenerator({ seed, a = DEFAULT_A, c = DEFAULT_C, m = DEFAULT_M } = {}) {
  let state = BigInt(seed !== undefined ? seed : Date.now());
  const bigA = BigInt(a);
  const bigC = BigInt(c);
  const bigM = BigInt(m);

  function next() {
    state = (bigA * state + bigC) % bigM;
    return Number(state) / m;
  }

  return { next };
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
 * ¿POR QUÉ ALCANZA CON UNA SOLA FUNCIÓN?
 * --------------------------------------
 * El método es ITERATIVO: cada vez que se invoca next() se avanza el estado y
 * se devuelve un u nuevo. Como el estado queda guardado, la siguiente llamada
 * parte de ahí y da otro u distinto. Por eso, para usar varias distribuciones
 * basta con invocar next() una vez por cada número que se necesite:
 *      const gen = createGenerator({ seed })
 *      gen.next()  // u para la 1ª distribución
 *      gen.next()  // u para la 2ª distribución
 *      gen.next()  // u para la 3ª... y así sucesivamente
 * No hacen falta funciones extra: una sola fábrica con su método next() resuelve
 * todo el flujo de la simulación.
 *
 * ¿Por qué BigInt? Porque a * n(i) puede dar números enormes (mayores que los
 * que JavaScript maneja con seguridad como Number: 2^53). BigInt permite operar
 * con enteros gigantes sin perder precisión; al final se convierte a Number.
 *
 * ##########################################################################
 * CONSTANTES POR DEFECTO  → líneas 12 a 14
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
 * ##########################################################################
 * function createGenerator({ seed, a, c, m })  → líneas 30 a 41
 * ##########################################################################
 * Crea un generador con su propio estado interno y devuelve su método next().
 * Es el único que usa la simulación (plantSimulation.js) para ser reproducible.
 *
 * Línea 30  → export function createGenerator({ seed, a = DEFAULT_A, c = DEFAULT_C, m = DEFAULT_M } = {}) {
 *   Declara y exporta la función. Recibe un objeto de opciones por
 *   desestructuración: si no se pasan a/c/m usa los valores por defecto, y el
 *   "= {}" final permite invocarla sin argumentos.
 *
 * Línea 31  → let state = BigInt(seed !== undefined ? seed : Date.now());
 *   Estado interno del generador. Ternario: usa la semilla recibida o, si no
 *   hay, INVOCA Date.now() (la hora actual). Se guarda como BigInt.
 *
 * Líneas 32-34 → const bigA/bigC/bigM = BigInt(a/c/m);
 *   Convierte los parámetros a BigInt una sola vez, para usarlos directamente
 *   en la fórmula sin reconvertir en cada llamada.
 *
 * --- function next()  → líneas 36 a 39 ---
 *   Es la función que realmente genera cada número del generador.
 * Línea 36  → function next() {  Declara la función interna (closure).
 * Línea 37  → state = (bigA * state + bigC) % bigM;
 *   Aplica la fórmula del MCM: multiplica el estado por bigA, suma bigC y toma
 *   el resto de dividir por bigM (operador %). El resultado se guarda como NUEVO
 *   estado, de modo que la próxima llamada parta de aquí (esto es lo iterativo).
 * Línea 38  → return Number(state) / m;
 *   Convierte el estado (BigInt) a Number y lo divide por m para "normalizarlo"
 *   al rango [0, 1). Devuelve ese u.
 * Línea 39  → }  Cierra next.
 *
 * Línea 41  → return { next };
 *   Devuelve un OBJETO con la función next(). Gracias al "closure", next() sigue
 *   accediendo a la variable "state" privada de esta instancia. Por eso cada
 *   generador creado mantiene su propia secuencia por separado, y cada llamada
 *   a next() entrega un número pseudoaleatorio distinto.
 *
 * =============================================================================
 */
