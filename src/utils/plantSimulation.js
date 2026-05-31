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
