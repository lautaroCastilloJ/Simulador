import { useState, useMemo } from 'react'
import { fmt, minToHoras } from '../utils/reporte'

// Métricas seleccionables para las barras.
const METRICAS = {
  llegadas: {
    label: 'Proyectores',
    unidad: 'proyectores',
    get: (d) => d.llegadas,
    fmtVal: (v) => fmt(v, 0),
  },
  tiempo: {
    label: 'Tiempo (h)',
    unidad: 'h',
    get: (d) => minToHoras(d.tiempoDia),
    fmtVal: (v) => fmt(v, 2),
  },
}

/**
 * Histograma interactivo de la actividad diaria.
 *  - Toggle de métrica (proyectores vs. horas): las barras se reescalan.
 *  - Hover / foco de teclado: resalta el día y actualiza el lector de detalle.
 *  - Clic: fija (📌) un día para que su detalle quede visible.
 *  - Línea de promedio de referencia.
 */
export default function HistogramaLlegadas({ logDiario }) {
  const [metrica, setMetrica] = useState('llegadas')
  const [activo, setActivo] = useState(null)  // día bajo hover/foco
  const [fijado, setFijado] = useState(null)  // día fijado por clic

  const m = METRICAS[metrica]

  const { max, promedio, totalLlegadas } = useMemo(() => {
    const valores = logDiario.map(m.get)
    return {
      max: Math.max(...valores, 1),
      promedio: valores.reduce((a, b) => a + b, 0) / (valores.length || 1),
      totalLlegadas: logDiario.reduce((a, d) => a + d.llegadas, 0),
    }
  }, [logDiario, metrica]) // eslint-disable-line react-hooks/exhaustive-deps

  const diaMostrado = fijado ?? activo
  const detalle = diaMostrado != null ? logDiario.find((d) => d.dia === diaMostrado) : null

  return (
    <div className="hist2">
      <div className="hist2__toolbar">
        <div className="hist2__toggle" role="group" aria-label="Métrica del gráfico">
          {Object.entries(METRICAS).map(([key, val]) => (
            <button
              key={key}
              type="button"
              className={`hist2__toggle-btn ${metrica === key ? 'is-active' : ''}`}
              onClick={() => setMetrica(key)}
              aria-pressed={metrica === key}
            >
              {val.label}
            </button>
          ))}
        </div>
        <span className="hist2__hint subtle">Pasá el mouse o tocá una barra · clic para fijar</span>
      </div>

      {/* Lector dinámico del día activo/fijado */}
      <div className={`hist2__readout ${detalle ? 'is-on' : ''}`} aria-live="polite">
        {detalle ? (
          <>
            <span className="hist2__readout-day">
              Día {detalle.dia}{fijado != null && ' 📌'}
            </span>
            <span>
              📽️ {fmt(detalle.llegadas, 0)} proyectores{' '}
              <span className="subtle">
                ({totalLlegadas ? fmt((100 * detalle.llegadas) / totalLlegadas, 1) : '0'}% del mes)
              </span>
            </span>
            <span>
              ⏱️ {fmt(minToHoras(detalle.tiempoDia), 2)} h{' '}
              <span className="subtle">({fmt(detalle.tiempoDia, 0)} min)</span>
            </span>
          </>
        ) : (
          <span className="subtle">Pasá el mouse sobre un día para ver su detalle.</span>
        )}
      </div>

      <div className="hist2__scroll">
       <div className="hist2__chart" style={{ '--prom': `${(promedio / max) * 100}%` }}>
        <div className="hist2__avg" aria-hidden="true">
          <span className="hist2__avg-label">prom {m.fmtVal(promedio)}</span>
        </div>

        {logDiario.map((d) => {
          const v = m.get(d)
          const esActivo = diaMostrado === d.dia
          const atenuado = diaMostrado != null && !esActivo
          return (
            <button
              type="button"
              key={d.dia}
              className={`hist2__bar-col ${esActivo ? 'is-active' : ''} ${atenuado ? 'is-dim' : ''}`}
              style={{ '--bar-h': `${(v / max) * 100}%` }}
              onMouseEnter={() => setActivo(d.dia)}
              onMouseLeave={() => setActivo(null)}
              onFocus={() => setActivo(d.dia)}
              onBlur={() => setActivo(null)}
              onClick={() => setFijado((f) => (f === d.dia ? null : d.dia))}
              aria-pressed={fijado === d.dia}
              aria-label={`Día ${d.dia}: ${fmt(d.llegadas, 0)} proyectores, ${fmt(minToHoras(d.tiempoDia), 2)} horas`}
            >
              <span className="hist2__bar" />
              <span className="hist2__bar-label">{d.dia}</span>
            </button>
          )
        })}
       </div>
      </div>
    </div>
  )
}
