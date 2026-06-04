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
 * Ícono de ayuda (ⓘ) con tooltip accesible. Se muestra al pasar el mouse
 * o al enfocarlo con el teclado (Tab). El texto se anuncia por lectores
 * de pantalla vía aria-label.
 */
function HelpTip({ text }) {
  return (
    <span className="help-tip" tabIndex={0} role="note" aria-label={text}>
      <span className="help-tip__icon" aria-hidden="true">ⓘ</span>
      <span className="help-tip__bubble" role="tooltip">{text}</span>
    </span>
  )
}

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
          <label htmlFor="pl-dias">
            Días
            <HelpTip text="Horizonte de simulación. Está fijo en 30 (1 mes laboral) porque el modelo matemático del trabajo está definido para ese período." />
          </label>
          <input id="pl-dias" type="number" value={DIAS_SIMULACION} disabled readOnly />
          <span className="field-hint subtle">fijo por el modelo (1 mes)</span>
        </div>
        <div className="field-row">
          <label htmlFor="pl-tasa">
            α (proyectores/día)
            <HelpTip text="Ritmo promedio de llegada de proyectores RAEE por día. Es la media de una distribución de Poisson: algunos días llegan más y otros menos. Subirlo simula mayor demanda y más carga de trabajo." />
          </label>
          <input
            id="pl-tasa" type="number" min="0.01" step="0.5"
            className={errores.tasa ? 'input-invalid' : undefined}
            aria-invalid={Boolean(errores.tasa)}
            value={tasa} onChange={e => setTasa(e.target.value)}
          />
        </div>
        {errores.tasa && <p className="field-error">{errores.tasa}</p>}

        <div className="field-row">
          <label htmlFor="pl-umbral">
            Umbral capacidad (horas/mes)
            <HelpTip text="Límite de horas de trabajo que la planta puede absorber en el mes. Al simular, se compara el tiempo total acumulado contra este valor: si lo supera, el sistema recomienda reubicar operarios o cambiar la estrategia." />
          </label>
          <input
            id="pl-umbral" type="number" min="1" step="1"
            className={errores.umbralHoras ? 'input-invalid' : undefined}
            aria-invalid={Boolean(errores.umbralHoras)}
            value={umbralHoras} onChange={e => setUmbralHoras(e.target.value)}
          />
        </div>
        {errores.umbralHoras && <p className="field-error">{errores.umbralHoras}</p>}

        <div className="field-row">
          <label htmlFor="pl-seed">
            Semilla n₀
            <HelpTip text="Valor inicial del generador de números aleatorios. Con una semilla fija obtenés siempre el mismo resultado (reproducible, ideal para comparar escenarios). El botón ↺ la vacía para usar la hora actual y obtener una corrida nueva al azar." />
          </label>
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
          <summary>
            Parámetros MCM
            <HelpTip text="Constantes del Método Congruencial Mixto, el algoritmo que genera los números pseudoaleatorios base: xₙ₊₁ = (a·xₙ + c) mod m. Vienen con valores estándar probados; no hace falta tocarlos para usar el simulador." />
          </summary>
          <div className="field-row">
            <label htmlFor="pl-a">
              a
              <HelpTip text="Multiplicador del MCM. Debe ser un entero ≥ 1 y menor que m." />
            </label>
            <input
              id="pl-a" type="number" step="1" min="1"
              className={errores.mcmA ? 'input-invalid' : undefined}
              aria-invalid={Boolean(errores.mcmA)}
              value={mcmA} onChange={e => setMcmA(e.target.value)}
            />
          </div>
          {errores.mcmA && <p className="field-error">{errores.mcmA}</p>}
          <div className="field-row">
            <label htmlFor="pl-c">
              c
              <HelpTip text="Incremento (constante aditiva) del MCM. Debe ser un entero ≥ 0 y menor que m." />
            </label>
            <input
              id="pl-c" type="number" step="1" min="0"
              className={errores.mcmC ? 'input-invalid' : undefined}
              aria-invalid={Boolean(errores.mcmC)}
              value={mcmC} onChange={e => setMcmC(e.target.value)}
            />
          </div>
          {errores.mcmC && <p className="field-error">{errores.mcmC}</p>}
          <div className="field-row">
            <label htmlFor="pl-m">
              m
              <HelpTip text="Módulo del MCM: define el rango y el período del generador. Debe ser un entero ≥ 2 y mayor que a y c." />
            </label>
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

/* =============================================================================
 * EXPLICACIÓN PASO A PASO DEL CÓDIGO (línea por línea) — SOLO LA PARTE JS
 * =============================================================================
 *
 * NOTA: Se explica únicamente la lógica JavaScript (imports, constantes,
 * funciones auxiliares, validación y el estado/lógica del componente). El
 * bloque "return ( ... )" con el HTML/JSX de la interfaz (líneas 124 a 343)
 * NO se detalla, porque es el marcado visual, no lógica de programación.
 *
 * ##########################################################################
 * IMPORTACIONES  → líneas 1 a 2
 * ##########################################################################
 * Línea 1  → import { useState, useCallback, useMemo } from 'react'
 *   Importa tres "hooks" de React: useState (guardar estado que, al cambiar,
 *   re-renderiza la vista), useCallback y useMemo (memorizar funciones/valores
 *   para no recalcularlos en cada render).
 * Línea 2  → import { runSimulation, ELECTROGREEM_CONFIG } from '../utils/plantSimulation'
 *   Importa el motor de simulación y su configuración por defecto.
 *
 * ##########################################################################
 * CONSTANTES Y FUNCIONES AUXILIARES  → líneas 4 a 18
 * ##########################################################################
 * Línea 4  → const MCM_DEFAULTS = { a: 1664525, c: 1013904223, m: 4294967296 }
 *   Valores por defecto del Método Congruencial Mixto que se cargan en el form.
 * Línea 7  → const DIAS_SIMULACION = 30
 *   Horizonte fijo del modelo: 30 días (1 mes laboral). No lo edita el usuario.
 * Línea 9  → const UMBRAL_HORAS_DEFAULT = 100
 *   Valor inicial del umbral de capacidad, expresado en horas/mes.
 * Línea 11 → const NOMBRES_RUTA = [...]
 *   Arreglo con los nombres legibles de las 4 rutas, en el mismo orden que sus
 *   índices, para mostrarlos en la tabla de resultados.
 *
 * Línea 13 → const fmt = (n, d = 2) => n.toLocaleString('es-AR', {...})
 *   Función flecha que formatea un número al estilo argentino (coma decimal,
 *   punto de miles) con "d" decimales (2 por defecto). toLocaleString INVOCA
 *   el formateador de números del navegador.
 *
 * Línea 17 → const minToHoras = (min) => min / 60
 *   Convierte minutos a horas (el motor trabaja en minutos; la UI, en horas).
 * Línea 18 → const horasToMin = (h) => h * 60
 *   Conversión inversa: horas a minutos.
 *
 * ##########################################################################
 * function HelpTip({ text })  → líneas 25 a 32
 * ##########################################################################
 * Es un componente pequeño que dibuja el ícono de ayuda (ⓘ) con su tooltip.
 * Su cuerpo es JSX (marcado), así que solo se menciona: recibe por props un
 * "text" y lo muestra como burbuja accesible (aria-label para lectores de
 * pantalla). No contiene lógica de programación adicional.
 *
 * ##########################################################################
 * function validarCampos({ ... })  → líneas 38 a 82
 * ##########################################################################
 * Recibe los valores de los campos del formulario (como texto) y devuelve un
 * objeto "errores" donde cada clave es un campo inválido y su valor el mensaje.
 * Si el objeto vuelve vacío, significa que todo es válido.
 *
 * Línea 39 → const errores = {}
 *   Crea el objeto vacío donde se irán acumulando los mensajes de error.
 *
 * Línea 41 → const aTasa = Number(tasa)
 *   Convierte el texto del campo "tasa" a número para poder compararlo.
 * Línea 42 → if (tasa.trim() === '' || !Number.isFinite(aTasa) || aTasa <= 0) {
 *   Marca error si: está vacío (trim quita espacios), no es un número finito,
 *   o es menor o igual a 0. Línea 43 → guarda el mensaje en errores.tasa.
 * Línea 44 → } else if (aTasa > 1000) {  Si es válido pero excesivo (>1000),
 *   Línea 45 → guarda otro mensaje de tope máximo.
 *
 * Líneas 48-53 → Misma idea para "umbralHoras": debe ser número > 0 y, como
 *   máximo, 100000; si no, guarda el mensaje correspondiente.
 *
 * Línea 56 → if (seed.trim() !== '') {
 *   La semilla es OPCIONAL: solo se valida si el usuario escribió algo.
 * Líneas 57-60 → si tiene contenido, debe ser un entero ≥ 0; si no, error.
 *
 * Líneas 63-65 → const a/c/m = Number(mcmA/mcmC/mcmM)
 *   Convierte a número los tres parámetros del MCM.
 * Líneas 67-69 → valida "m": entero ≥ 2 (es el módulo, no puede ser chico).
 * Líneas 70-74 → valida "a": entero ≥ 1 y, si m es válido, además a < m.
 * Líneas 75-79 → valida "c": entero ≥ 0 y, si m es válido, además c < m.
 *   (El "!errores.mcmM" evita comparar contra un m que ya sabemos inválido.)
 *
 * Línea 81 → return errores
 *   Devuelve el objeto con todos los errores encontrados (vacío si no hubo).
 *
 * ##########################################################################
 * function PlantSimulator()  → líneas 84 a 344 (el componente principal)
 * ##########################################################################
 * Aquí solo se explica su LÓGICA JS (líneas 84 a 122). El "return ( ... )" con
 * la interfaz queda fuera por pedido.
 *
 * Línea 84 → export default function PlantSimulator() {
 *   Declara y exporta por defecto el componente. React lo INVOCA para dibujarlo.
 *
 * Líneas 85-91 → const [valor, setValor] = useState(inicial)
 *   Cada llamada a useState crea una pieza de estado y su función para
 *   modificarla. Cuando esa función se invoca, React vuelve a renderizar:
 *     - seed: semilla (arranca en '12345').
 *     - tasa: α, inicializada desde la config (String() lo pasa a texto porque
 *       los <input> manejan strings).
 *     - umbralHoras: umbral en horas (desde UMBRAL_HORAS_DEFAULT).
 *     - mcmA, mcmC, mcmM: los tres parámetros del MCM (desde MCM_DEFAULTS).
 *
 * Línea 93 → const [results, setResults] = useState(null)
 *   Estado que guardará el resultado de la simulación. Empieza en null (todavía
 *   no se simuló nada), por eso la sección de resultados no se muestra al inicio.
 *
 * Líneas 96-99 → const errores = useMemo(() => validarCampos({...}), [deps])
 *   useMemo recalcula la validación SOLO cuando cambia alguno de los campos del
 *   arreglo de dependencias. Así la validación es "reactiva" (se actualiza al
 *   tipear) sin recalcularse de más. INVOCA validarCampos con los valores actuales.
 *
 * Línea 100 → const hayErrores = Object.keys(errores).length > 0
 *   Object.keys() INVOCA la obtención de las claves del objeto errores; si hay
 *   al menos una, "hayErrores" es true (el formulario no es válido).
 *
 * Líneas 102-120 → const handleRun = useCallback(() => { ... }, [deps])
 *   Define la función que se ejecuta al presionar "Simular". useCallback la
 *   memoriza y solo la recrea si cambian sus dependencias.
 *   · Línea 103 → if (hayErrores) return  Corta si hay errores (no simula).
 *   · Línea 106 → const uCap = horasToMin(Number(umbralHoras))  Convierte el
 *       umbral de horas a minutos, porque el motor compara en minutos.
 *   · Línea 107 → const usedSeed = seed.trim() !== '' ? parseInt(seed, 10) : Date.now()
 *       Si hay semilla, la pasa a entero (parseInt base 10); si está vacía,
 *       INVOCA Date.now() para una corrida aleatoria.
 *   · Líneas 109-118 → const r = runSimulation({...})  INVOCA el motor pasándole
 *       la semilla, los parámetros MCM (convertidos a entero) y una config que
 *       parte de ELECTROGREEM_CONFIG (operador spread ...) y pisa dias,
 *       tasaLlegadas y umbralCapacidad con los valores del formulario.
 *   · Línea 119 → setResults(r)  Guarda el resultado en el estado, lo que
 *       dispara el re-render y hace aparecer la sección de resultados.
 *
 * Línea 122 → const maxLlegadas = results ? Math.max(...results.logDiario.map(d => d.llegadas), 1) : 1
 *   Calcula el máximo de llegadas diarias para escalar las barras del histograma.
 *   · .map(d => d.llegadas) → arma un arreglo solo con las llegadas de cada día.
 *   · Math.max(...arreglo, 1) → INVOCA el máximo; el "..." (spread) pasa el
 *     arreglo como argumentos sueltos, y el 1 evita dividir por 0 si no hay datos.
 *   · El "results ? ... : 1" usa 1 mientras todavía no haya resultados.
 *
 * (A partir de la línea 124 comienza el "return ( ... )" con el JSX de la
 *  interfaz, que no se detalla por tratarse del HTML del componente.)
 *
 * =============================================================================
 */
