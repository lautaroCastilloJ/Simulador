/**
 * Motor de simulación — Planta ElectroGreem S.R.L. (tratamiento de RAEE)
 *
 * Simula la recepción y procesamiento de proyectores en desuso durante un
 * horizonte de días. Orquesta las distintas distribuciones:
 *
 *   • Llegadas diarias .......... Poisson(α)              [distributionPoisson]
 *   • Triaje inicial ............ Uniforme(20, 35) min     [distributionUniform]
 *   • Clasificación de ruta ..... Multinomial(F(X))        [distributionMultinomial]
 *   • Tiempo de servicio ........ Exponencial(E(X))        [distributionExponential]
 *   • Masa de mercurio .......... Uniforme(100, 300)       [distributionUniform]
 *   • Masa de plásticos/metales . Uniforme(800, 1200)      [distributionUniform]
 *
 * Flujo por proyector:
 *   triaje (SIEMPRE) → clasificación → servicio según ruta (+ recuperación)
 *   tiempo total de revisión = triaje + servicio
 */

import { createGenerator } from './pseudoRandom.js'
import { poissonRandom } from './distributionPoisson.js'
import { uniformRandom } from './distributionUniform.js'
import { exponentialRandom } from './distributionExponential.js'
import { multinomialPick } from './distributionMultinomial.js'

// Índices de ruta (orden = orden de las probabilidades acumuladas F(X))
export const RUTA = {
  REACONDICIONAMIENTO: 0,
  DESENSAMBLAJE: 1,
  DESCONTAMINACION: 2,
  ALMACENAMIENTO: 3,
}

/**
 * Configuración por defecto del modelo ElectroGreem S.R.L.
 * Todos los valores provienen del enunciado del problema.
 */
export const ELECTROGREEM_CONFIG = {
  dias: 30,                 // horizonte de simulación
  tasaLlegadas: 3,          // α: proyectores por día (Poisson)
  triaje: { a: 20, b: 35 }, // tiempo de inspección inicial (Uniforme, min)

  // Probabilidades de cada ruta → F(X) acumulada: 0.35, 0.75, 0.85, 1.00
  probabilidades: [0.35, 0.40, 0.10, 0.15],

  rutas: [
    { nombre: 'Reacondicionamiento', mediaServicio: 90 },
    { nombre: 'Desensamblaje',       mediaServicio: 20 },
    { nombre: 'Descontaminación',    mediaServicio: 50 },
    { nombre: 'Almacenamiento',      mediaServicio: 0  }, // sin tiempo de servicio
  ],

  // Recuperación de mercurio (ruta Descontaminación): m = 100 + 200·u
  mercurio: { a: 100, b: 300, tasaRecuperacion: 0.70 },
  // Recuperación de plásticos/metales (ruta Desensamblaje): pm = 800 + 400·u
  materiales: { a: 800, b: 1200, tasaRecuperacion: 0.35 },

  // Umbral de capacidad operativa (min). Si el tiempo total lo supera → reubicar.
  umbralCapacidad: 30000,
}

/**
 * Ejecuta la simulación completa de la planta.
 *
 * @param {object} [options={}]                 - Opciones de ejecución.
 * @param {object} [options.config]             - Config del modelo (ver ELECTROGREEM_CONFIG).
 * @param {number} [options.seed]               - Semilla del MCM (reproducibilidad).
 * @param {object} [options.mcm]                - Parámetros { a, c, m } del MCM.
 * @returns {object} Resultados agregados, log diario y decisión gerencial.
 */
export function runSimulation({ config = ELECTROGREEM_CONFIG, seed, mcm = {} } = {}) {
  const cfg = { ...ELECTROGREEM_CONFIG, ...config }
  const usedSeed = seed !== undefined ? seed : Date.now()
  const gen = createGenerator({ seed: usedSeed, ...mcm })
  const nextU = () => gen.next()

  // Acumuladores globales
  let tiempoTotalRevision = 0       // triaje + servicio de todos los equipos (min)
  let tiempoTriajeTotal = 0
  let tiempoServicioTotal = 0
  let mercurioRecuperado = 0        // unidades de masa
  let materialesRecuperados = 0     // unidades de masa
  let totalProyectores = 0
  const conteoRutas = [0, 0, 0, 0]

  const logDiario = []

  for (let dia = 1; dia <= cfg.dias; dia++) {
    const llegadas = poissonRandom(nextU, cfg.tasaLlegadas)

    let tiempoDia = 0
    let mercurioDia = 0
    let materialesDia = 0
    const rutasDia = [0, 0, 0, 0]

    for (let i = 0; i < llegadas; i++) {
      totalProyectores++

      // 1) Triaje inicial — SIEMPRE consume tiempo
      const triaje = uniformRandom(nextU, cfg.triaje.a, cfg.triaje.b)
      tiempoTriajeTotal += triaje

      // 2) Clasificación: un U(0,1) contra F(X) acumulada
      const { index: ruta } = multinomialPick(nextU, cfg.probabilidades)
      conteoRutas[ruta]++
      rutasDia[ruta]++

      // 3) Tiempo de servicio según la ruta (Almacenamiento = 0)
      let servicio = 0
      if (cfg.rutas[ruta].mediaServicio > 0) {
        servicio = exponentialRandom(nextU, cfg.rutas[ruta].mediaServicio)
      }
      tiempoServicioTotal += servicio

      // 4) Recuperación de materiales según la ruta
      if (ruta === RUTA.DESCONTAMINACION) {
        const m = uniformRandom(nextU, cfg.mercurio.a, cfg.mercurio.b)
        const recuperado = m * cfg.mercurio.tasaRecuperacion
        mercurioRecuperado += recuperado
        mercurioDia += recuperado
      } else if (ruta === RUTA.DESENSAMBLAJE) {
        const pm = uniformRandom(nextU, cfg.materiales.a, cfg.materiales.b)
        const recuperado = pm * cfg.materiales.tasaRecuperacion
        materialesRecuperados += recuperado
        materialesDia += recuperado
      }

      tiempoDia += triaje + servicio
    }

    tiempoTotalRevision += tiempoDia
    logDiario.push({
      dia,
      llegadas,
      tiempoDia,
      rutasDia,
      mercurioDia,
      materialesDia,
    })
  }

  const superaUmbral = tiempoTotalRevision > cfg.umbralCapacidad

  return {
    seed: usedSeed,
    config: cfg,
    // Indicadores principales del enunciado
    tiempoTotalRevision,
    mercurioRecuperado,
    materialesRecuperados,
    // Desgloses auxiliares
    tiempoTriajeTotal,
    tiempoServicioTotal,
    totalProyectores,
    conteoRutas,
    logDiario,
    // Criterio de decisión gerencial
    decision: {
      superaUmbral,
      umbral: cfg.umbralCapacidad,
      recomendacion: superaUmbral
        ? 'El tiempo acumulado supera la capacidad operativa: reubicar operarios o cambiar la estrategia de trabajo para descongestionar las estaciones.'
        : 'El tiempo acumulado está dentro de la capacidad operativa: el sistema puede seguir operando con el mismo método de trabajo.',
    },
  }
}

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea)
 * =============================================================================
 *
 * ##########################################################################
 * IMPORTACIONES  → líneas 19 a 23
 * ##########################################################################
 * Traen al archivo las funciones que viven en otros módulos para poder usarlas.
 *
 * Línea 19  → import { createGenerator } from './pseudoRandom.js'
 *   Importa la fábrica del generador de números pseudoaleatorios (MCM).
 * Línea 20  → import { poissonRandom } from './distributionPoisson.js'
 *   Importa la función que genera las llegadas diarias (Poisson).
 * Línea 21  → import { uniformRandom } from './distributionUniform.js'
 *   Importa la función que genera valores Uniformes (triaje, masas).
 * Línea 22  → import { exponentialRandom } from './distributionExponential.js'
 *   Importa la función que genera el tiempo de servicio (Exponencial).
 * Línea 23  → import { multinomialPick } from './distributionMultinomial.js'
 *   Importa la función que clasifica la ruta de cada proyector (Multinomial).
 *
 * ##########################################################################
 * CONSTANTE RUTA  → líneas 26 a 31
 * ##########################################################################
 * Línea 26  → export const RUTA = {
 *   Declara y exporta un objeto que asigna un NOMBRE legible a cada índice de
 *   ruta. Sirve para escribir RUTA.DESCONTAMINACION en lugar de un número suelto.
 * Líneas 27-30 → REACONDICIONAMIENTO: 0, DESENSAMBLAJE: 1, DESCONTAMINACION: 2,
 *   ALMACENAMIENTO: 3. Cada ruta recibe el índice que le corresponde en el
 *   arreglo de probabilidades acumuladas F(X).
 * Línea 31  → }  Cierra el objeto RUTA.
 *
 * ##########################################################################
 * CONFIGURACIÓN ELECTROGREEM_CONFIG  → líneas 37 a 59
 * ##########################################################################
 * Objeto exportado con todos los parámetros del modelo (vienen del enunciado).
 *
 * Línea 37  → export const ELECTROGREEM_CONFIG = {  Abre el objeto de config.
 * Línea 38  → dias: 30  Cantidad de días que dura la simulación (horizonte).
 * Línea 39  → tasaLlegadas: 3  α de la Poisson: proyectores promedio por día.
 * Línea 40  → triaje: { a: 20, b: 35 }  Límites de la Uniforme del triaje (min).
 * Línea 43  → probabilidades: [0.35, 0.40, 0.10, 0.15]  Probabilidad de cada
 *   ruta; al acumularlas dan F(X) = 0.35, 0.75, 0.85, 1.00.
 * Líneas 45-50 → rutas: [...]  Arreglo con el nombre y la media de servicio
 *   (mediaServicio) de cada ruta. Almacenamiento usa 0 (no consume servicio).
 * Línea 53  → mercurio: { a, b, tasaRecuperacion }  Parámetros de la Uniforme de
 *   masa de mercurio y el porcentaje que se recupera (0.70).
 * Línea 55  → materiales: { a, b, tasaRecuperacion }  Ídem para plásticos/metales.
 * Línea 58  → umbralCapacidad: 30000  Tope de minutos; si se supera, hay que
 *   reubicar. Línea 59 → }  Cierra el objeto de configuración.
 *
 * ##########################################################################
 * function runSimulation({ config, seed, mcm })  → líneas 70 a 165
 * ##########################################################################
 * Es el motor: ejecuta toda la simulación y devuelve los resultados agregados.
 *
 * Línea 70  → export function runSimulation({ config = ELECTROGREEM_CONFIG, seed, mcm = {} } = {}) {
 *   Declara y exporta la función. Usa desestructuración con valores por defecto:
 *   si no se pasa config usa ELECTROGREEM_CONFIG, mcm vacío {}, y el "= {}" final
 *   permite llamarla incluso sin argumentos.
 *
 * Línea 71  → const cfg = { ...ELECTROGREEM_CONFIG, ...config }
 *   Combina (operador spread ...) la config por defecto con la recibida. Lo que
 *   venga en "config" pisa a lo de ELECTROGREEM_CONFIG. "cfg" es la config final.
 *
 * Línea 72  → const usedSeed = seed !== undefined ? seed : Date.now()
 *   Operador ternario: si se pasó una semilla la usa (reproducibilidad); si no,
 *   INVOCA Date.now() para generar una semilla basada en la hora actual.
 *
 * Línea 73  → const gen = createGenerator({ seed: usedSeed, ...mcm })
 *   INVOCA createGenerator() para crear el generador MCM con la semilla y los
 *   parámetros { a, c, m } opcionales. Devuelve un objeto generador en "gen".
 *
 * Línea 74  → const nextU = () => gen.next()
 *   Define una función flecha "nextU" que, al invocarla, INVOCA gen.next() y
 *   devuelve el siguiente u ∈ [0, 1). Es la que se pasa a las distribuciones.
 *
 * Líneas 77-83  → Acumuladores globales inicializados en 0:
 *   tiempoTotalRevision (triaje + servicio de todos), tiempoTriajeTotal,
 *   tiempoServicioTotal, mercurioRecuperado, materialesRecuperados,
 *   totalProyectores y conteoRutas = [0,0,0,0] (cuántos cayeron en cada ruta).
 *
 * Línea 85  → const logDiario = []
 *   Arreglo vacío donde se guardará un resumen por cada día simulado.
 *
 * --------------------------------------------------------------------------
 * BUCLE DE DÍAS  → líneas 87 a 139
 * --------------------------------------------------------------------------
 * Línea 87  → for (let dia = 1; dia <= cfg.dias; dia++) {
 *   Repite el bloque una vez por cada día, desde el día 1 hasta cfg.dias (30).
 *
 * Línea 88  → const llegadas = poissonRandom(nextU, cfg.tasaLlegadas)
 *   INVOCA poissonRandom() para obtener cuántos proyectores llegan ese día
 *   (entero), usando la tasa α = cfg.tasaLlegadas.
 *
 * Líneas 90-93  → Acumuladores DEL DÍA inicializados en 0: tiempoDia,
 *   mercurioDia, materialesDia y rutasDia = [0,0,0,0]. Se reinician cada día.
 *
 * --------------------------------------------------------------------------
 * BUCLE DE PROYECTORES DEL DÍA  → líneas 95 a 128
 * --------------------------------------------------------------------------
 * Línea 95  → for (let i = 0; i < llegadas; i++) {
 *   Repite el procesamiento una vez por cada proyector que llegó ese día.
 *
 * Línea 96  → totalProyectores++
 *   Suma 1 al contador global de proyectores procesados.
 *
 * Línea 99  → const triaje = uniformRandom(nextU, cfg.triaje.a, cfg.triaje.b)
 *   1) Triaje (SIEMPRE): INVOCA uniformRandom() para obtener el tiempo de
 *   inspección inicial entre 20 y 35 min.
 * Línea 100 → tiempoTriajeTotal += triaje  Suma ese triaje al acumulado global.
 *
 * Línea 103 → const { index: ruta } = multinomialPick(nextU, cfg.probabilidades)
 *   2) Clasificación: INVOCA multinomialPick() y, por desestructuración, guarda
 *   en "ruta" el campo "index" devuelto (la categoría/ruta elegida).
 * Línea 104 → conteoRutas[ruta]++  Suma 1 a esa ruta en el conteo global.
 * Línea 105 → rutasDia[ruta]++     Suma 1 a esa ruta en el conteo del día.
 *
 * Línea 108 → let servicio = 0
 *   3) Servicio: inicializa el tiempo de servicio en 0 (sirve para Almacenamiento).
 * Línea 109 → if (cfg.rutas[ruta].mediaServicio > 0) {
 *   Solo calcula servicio si la ruta tiene media > 0 (Almacenamiento es 0).
 * Línea 110 → servicio = exponentialRandom(nextU, cfg.rutas[ruta].mediaServicio)
 *   INVOCA exponentialRandom() para obtener el tiempo de servicio según la
 *   media de la ruta. Línea 111 → }  Cierra el if.
 * Línea 112 → tiempoServicioTotal += servicio  Suma el servicio al acumulado global.
 *
 * Línea 115 → if (ruta === RUTA.DESCONTAMINACION) {
 *   4) Recuperación de materiales según la ruta. Si es Descontaminación:
 * Línea 116 →   const m = uniformRandom(nextU, cfg.mercurio.a, cfg.mercurio.b)
 *     INVOCA uniformRandom() para la masa de mercurio (100 a 300).
 * Línea 117 →   const recuperado = m * cfg.mercurio.tasaRecuperacion
 *     Multiplica la masa por la tasa (0.70) → mercurio efectivamente recuperado.
 * Líneas 118-119 → Suma "recuperado" al acumulado global y al del día.
 * Línea 120 → } else if (ruta === RUTA.DESENSAMBLAJE) {
 *   Si en cambio la ruta es Desensamblaje:
 * Línea 121 →   const pm = uniformRandom(nextU, cfg.materiales.a, cfg.materiales.b)
 *     INVOCA uniformRandom() para la masa de plásticos/metales (800 a 1200).
 * Línea 122 →   const recuperado = pm * cfg.materiales.tasaRecuperacion
 *     Multiplica por la tasa (0.35) → materiales recuperados.
 * Líneas 123-124 → Suma al acumulado global y al del día.
 * Línea 125 → }  Cierra el bloque if/else if (las otras rutas no recuperan nada).
 *
 * Línea 127 → tiempoDia += triaje + servicio
 *   Suma al tiempo del día el total de revisión de este proyector (triaje + servicio).
 * Línea 128 → }  Cierra el bucle de proyectores del día.
 *
 * Línea 130 → tiempoTotalRevision += tiempoDia
 *   Acumula el tiempo del día al gran total de toda la simulación.
 * Líneas 131-138 → logDiario.push({ ... })
 *   INVOCA push() para agregar al log un objeto con el resumen del día: número
 *   de día, llegadas, tiempoDia, rutasDia, mercurioDia y materialesDia.
 * Línea 139 → }  Cierra el bucle de días.
 *
 * --------------------------------------------------------------------------
 * RESULTADO FINAL  → líneas 141 a 164
 * --------------------------------------------------------------------------
 * Línea 141 → const superaUmbral = tiempoTotalRevision > cfg.umbralCapacidad
 *   Compara el tiempo total acumulado contra el umbral de capacidad. Guarda en
 *   "superaUmbral" un booleano (true si se pasó del límite).
 *
 * Líneas 143-164 → return { ... }
 *   Devuelve un único objeto con todos los resultados:
 *     - seed, config: la semilla usada y la config aplicada (reproducibilidad).
 *     - tiempoTotalRevision, mercurioRecuperado, materialesRecuperados:
 *       indicadores principales pedidos en el enunciado.
 *     - tiempoTriajeTotal, tiempoServicioTotal, totalProyectores, conteoRutas,
 *       logDiario: desgloses auxiliares para análisis.
 *     - decision: objeto con superaUmbral, el umbral y una "recomendacion"
 *       elegida con un ternario según si se superó o no la capacidad operativa.
 *
 * Línea 165 → }  Cierra la función runSimulation.
 *
 * =============================================================================
 */
