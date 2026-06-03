import { useState, useCallback, useMemo } from 'react'
import { runSimulation, ELECTROGREEM_CONFIG } from '../utils/plantSimulation'

const MCM_DEFAULTS = { a: 1664525, c: 1013904223, m: 4294967296 }

// Horizonte fijo por el modelo matemático: 30 días (un mes laboral).
const DIAS_SIMULACION = 30
// Valor por defecto del umbral de capacidad operativa.
const UMBRAL_HORAS_DEFAULT = 100

const NOMBRES_RUTA = ['Reacondicionamiento', 'Desensamblaje', 'Descontaminación', 'Almacenamiento']

const fmt = (n, d = 2) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

// El motor trabaja en minutos; la interfaz opera en horas laborales.
const minToHoras = (min) => min / 60
const horasToMin = (h) => h * 60

/**
 * Valida los campos del formulario y devuelve un objeto { campo: mensaje }
 * con solo los campos que tienen un valor inconsistente.
 */
function validarCampos({ tasa, umbralHoras, seed, mcmA, mcmC, mcmM }) {
  const errores = {}

  const aTasa = Number(tasa)
  if (tasa.trim() === '' || !Number.isFinite(aTasa) || aTasa <= 0) {
    errores.tasa = 'Debe ser un número mayor que 0.'
  } else if (aTasa > 1000) {
    errores.tasa = 'Demasiado alto (máx. 1000 proyectores/día).'
  }

  const uHoras = Number(umbralHoras)
  if (umbralHoras.trim() === '' || !Number.isFinite(uHoras) || uHoras <= 0) {
    errores.umbralHoras = 'Debe ser un número de horas mayor que 0.'
  } else if (uHoras > 100000) {
    errores.umbralHoras = 'Valor de horas demasiado alto.'
  }

  // La semilla es opcional: vacío ⇒ se usa Date.now().
  if (seed.trim() !== '') {
    const s = Number(seed)
    if (!Number.isInteger(s) || s < 0) {
      errores.seed = 'Entero ≥ 0, o dejar vacío para aleatoria.'
    }
  }

  const a = Number(mcmA)
  const c = Number(mcmC)
  const m = Number(mcmM)

  if (mcmM.trim() === '' || !Number.isInteger(m) || m < 2) {
    errores.mcmM = 'm debe ser un entero ≥ 2.'
  }
  if (mcmA.trim() === '' || !Number.isInteger(a) || a < 1) {
    errores.mcmA = 'a debe ser un entero ≥ 1.'
  } else if (!errores.mcmM && a >= m) {
    errores.mcmA = 'a debe ser menor que m.'
  }
  if (mcmC.trim() === '' || !Number.isInteger(c) || c < 0) {
    errores.mcmC = 'c debe ser un entero ≥ 0.'
  } else if (!errores.mcmM && c >= m) {
    errores.mcmC = 'c debe ser menor que m.'
  }

  return errores
}

export default function PlantSimulator() {
  const [seed, setSeed]       = useState('12345')
  const [tasa, setTasa]       = useState(String(ELECTROGREEM_CONFIG.tasaLlegadas))
  // El umbral se carga en HORAS laborales por mes; se convierte a minutos al simular.
  const [umbralHoras, setUmbralHoras] = useState(String(UMBRAL_HORAS_DEFAULT))
  const [mcmA, setMcmA]       = useState(String(MCM_DEFAULTS.a))
  const [mcmC, setMcmC]       = useState(String(MCM_DEFAULTS.c))
  const [mcmM, setMcmM]       = useState(String(MCM_DEFAULTS.m))

  const [results, setResults] = useState(null)

  // Validación reactiva: se recalcula con cada cambio de campo.
  const errores = useMemo(
    () => validarCampos({ tasa, umbralHoras, seed, mcmA, mcmC, mcmM }),
    [tasa, umbralHoras, seed, mcmA, mcmC, mcmM],
  )
  const hayErrores = Object.keys(errores).length > 0

  const handleRun = useCallback(() => {
    if (hayErrores) return

    // El motor compara en minutos: convertimos las horas laborales cargadas.
    const uCap = horasToMin(Number(umbralHoras))
    const usedSeed = seed.trim() !== '' ? parseInt(seed, 10) : Date.now()

    const r = runSimulation({
      seed: usedSeed,
      mcm: { a: parseInt(mcmA, 10), c: parseInt(mcmC, 10), m: parseInt(mcmM, 10) },
      config: {
        ...ELECTROGREEM_CONFIG,
        dias: DIAS_SIMULACION,
        tasaLlegadas: Number(tasa),
        umbralCapacidad: uCap,
      },
    })
    setResults(r)
  }, [hayErrores, seed, tasa, umbralHoras, mcmA, mcmC, mcmM])

  const maxLlegadas = results ? Math.max(...results.logDiario.map(d => d.llegadas), 1) : 1

  return (
    <>
      <a
        className="btn-docs"
        href="https://github.com/lautaroCastilloJ/Simulador#readme"
        target="_blank"
        rel="noopener noreferrer"
      >
        📄 Documentación
      </a>

      <section id="plant-header">
        <img className="brand-logo" src="/logoElectrogreem.jpg" alt="Logo ElectroGreem S.R.L." />
        <h1>Planta ElectroGreem S.R.L.</h1>
        <p>Simulación de tratamiento de proyectores RAEE sobre un horizonte de 30 días (1 mes)</p>
      </section>

      <section id="plant-config">
        <div className="field-row">
          <label htmlFor="pl-dias">Días</label>
          <input id="pl-dias" type="number" value={DIAS_SIMULACION} disabled readOnly />
          <span className="field-hint subtle">fijo por el modelo (1 mes)</span>
        </div>
        <div className="field-row">
          <label htmlFor="pl-tasa">α (proyectores/día)</label>
          <input
            id="pl-tasa" type="number" min="0.01" step="0.5"
            className={errores.tasa ? 'input-invalid' : undefined}
            aria-invalid={Boolean(errores.tasa)}
            value={tasa} onChange={e => setTasa(e.target.value)}
          />
        </div>
        {errores.tasa && <p className="field-error">{errores.tasa}</p>}

        <div className="field-row">
          <label htmlFor="pl-umbral">Umbral capacidad (horas/mes)</label>
          <input
            id="pl-umbral" type="number" min="1" step="1"
            className={errores.umbralHoras ? 'input-invalid' : undefined}
            aria-invalid={Boolean(errores.umbralHoras)}
            value={umbralHoras} onChange={e => setUmbralHoras(e.target.value)}
          />
        </div>
        {errores.umbralHoras && <p className="field-error">{errores.umbralHoras}</p>}

        <div className="field-row">
          <label htmlFor="pl-seed">Semilla n₀</label>
          <input
            id="pl-seed" type="number" step="1" min="0" placeholder="Date.now()"
            className={errores.seed ? 'input-invalid' : undefined}
            aria-invalid={Boolean(errores.seed)}
            value={seed} onChange={e => setSeed(e.target.value)}
          />
          <button type="button" className="btn-ghost" title="Usar Date.now()" onClick={() => setSeed('')}>↺</button>
        </div>
        {errores.seed && <p className="field-error">{errores.seed}</p>}

        <details className="advanced-params">
          <summary>Parámetros MCM</summary>
          <div className="field-row">
            <label htmlFor="pl-a">a</label>
            <input
              id="pl-a" type="number" step="1" min="1"
              className={errores.mcmA ? 'input-invalid' : undefined}
              aria-invalid={Boolean(errores.mcmA)}
              value={mcmA} onChange={e => setMcmA(e.target.value)}
            />
          </div>
          {errores.mcmA && <p className="field-error">{errores.mcmA}</p>}
          <div className="field-row">
            <label htmlFor="pl-c">c</label>
            <input
              id="pl-c" type="number" step="1" min="0"
              className={errores.mcmC ? 'input-invalid' : undefined}
              aria-invalid={Boolean(errores.mcmC)}
              value={mcmC} onChange={e => setMcmC(e.target.value)}
            />
          </div>
          {errores.mcmC && <p className="field-error">{errores.mcmC}</p>}
          <div className="field-row">
            <label htmlFor="pl-m">m</label>
            <input
              id="pl-m" type="number" step="1" min="2"
              className={errores.mcmM ? 'input-invalid' : undefined}
              aria-invalid={Boolean(errores.mcmM)}
              value={mcmM} onChange={e => setMcmM(e.target.value)}
            />
          </div>
          {errores.mcmM && <p className="field-error">{errores.mcmM}</p>}
        </details>

        {hayErrores && <p className="tester-error">Revisá los campos marcados antes de simular.</p>}

        <button
          type="button" className="btn-primary btn-generate"
          onClick={handleRun} disabled={hayErrores}
        >
          Simular
        </button>
      </section>

      {results && (
        <>
          <section id="plant-results">
            {/* Indicadores principales del enunciado */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Tiempo total de revisión</span>
                <span className="stat-value">{fmt(minToHoras(results.tiempoTotalRevision))} h</span>
                <span className="stat-sub subtle">{fmt(results.tiempoTotalRevision)} min</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mercurio recuperado</span>
                <span className="stat-value">{fmt(results.mercurioRecuperado)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Materiales recuperados</span>
                <span className="stat-value">{fmt(results.materialesRecuperados)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Proyectores procesados</span>
                <span className="stat-value">{results.totalProyectores}</span>
              </div>
              <div className="stat-card stat-card--theory">
                <span className="stat-label">Triaje acumulado</span>
                <span className="stat-value">{fmt(results.tiempoTriajeTotal)} min</span>
              </div>
              <div className="stat-card stat-card--theory">
                <span className="stat-label">Servicio acumulado</span>
                <span className="stat-value">{fmt(results.tiempoServicioTotal)} min</span>
              </div>
            </div>

            {/* Decisión gerencial */}
            <div className={`decision-banner ${results.decision.superaUmbral ? 'decision-banner--alert' : 'decision-banner--ok'}`}>
              <strong>
                {results.decision.superaUmbral
                  ? '⚠ Supera el umbral de capacidad'
                  : '✓ Dentro de la capacidad operativa'}
              </strong>
              <span>
                {fmt(minToHoras(results.tiempoTotalRevision))} h{' '}
                {results.decision.superaUmbral ? '>' : '≤'}{' '}
                {fmt(minToHoras(results.decision.umbral))} h
                <span className="subtle">
                  {' '}({fmt(results.tiempoTotalRevision)} min vs {fmt(results.decision.umbral)} min)
                </span>
              </span>
              <p>{results.decision.recomendacion}</p>
              <p className="subtle">
                Acumulado sobre {results.config.dias} días (1 mes laboral).
              </p>
            </div>

            {/* Distribución por ruta */}
            <div>
              <h2>Derivación por ruta</h2>
              <table id="ruta-table">
                <thead>
                  <tr><th>Ruta</th><th>Equipos</th><th>%</th><th>Prob. teórica</th></tr>
                </thead>
                <tbody>
                  {results.conteoRutas.map((c, i) => (
                    <tr key={i}>
                      <td>{NOMBRES_RUTA[i]}</td>
                      <td>{c}</td>
                      <td>{results.totalProyectores ? fmt(100 * c / results.totalProyectores, 1) : '0.0'}%</td>
                      <td className="subtle">{fmt(100 * results.config.probabilidades[i], 0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Llegadas por día */}
            <div>
              <h2>Llegadas por día <span className="subtle">(semilla {results.seed})</span></h2>
              <div className="histogram-bars">
                {results.logDiario.map(d => (
                  <div key={d.dia} className="bar-col">
                    <span className="bar-count">{d.llegadas}</span>
                    <div
                      className="bar"
                      style={{ '--bar-h': `${(d.llegadas / maxLlegadas) * 100}%` }}
                      title={`Día ${d.dia}: ${d.llegadas} proyectores · ${fmt(d.tiempoDia)} min`}
                    />
                    <span className="bar-label">{d.dia}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
