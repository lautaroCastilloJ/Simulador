import { useEffect } from 'react'
import {
  NOMBRES_RUTA, ICONOS_RUTA, fmt, minToHoras, fmtFecha, abrirReportePDF,
} from '../utils/reporte'

/**
 * Panel lateral con el historial de simulaciones de la sesión.
 * Tiene dos vistas: la LISTA de corridas y el DETALLE de una corrida
 * seleccionada (desde donde se puede exportar el reporte a PDF).
 */
export default function HistorialPanel({
  historial, detalleId, onClose, onSelect, onBack, onLimpiar,
}) {
  const entry = detalleId ? historial.find((h) => h.id === detalleId) : null

  // Cierra con Escape (retrocede del detalle a la lista, o cierra el panel).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (entry) onBack()
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entry, onBack, onClose])

  return (
    <div className="hist-overlay" role="dialog" aria-modal="true" aria-label="Historial de simulaciones" onClick={onClose}>
      <aside className="hist-panel" onClick={(e) => e.stopPropagation()}>
        <header className="hist-panel__head">
          {entry ? (
            <button type="button" className="btn-ghost" onClick={onBack}>← Volver</button>
          ) : (
            <h2 className="hist-panel__title">🕘 Historial de la sesión</h2>
          )}
          <button type="button" className="hist-panel__close" onClick={onClose} aria-label="Cerrar historial">✕</button>
        </header>

        {entry ? <Detalle entry={entry} /> : (
          <Lista historial={historial} onSelect={onSelect} onLimpiar={onLimpiar} />
        )}
      </aside>
    </div>
  )
}

/* ── Vista LISTA ─────────────────────────────────────────── */
function Lista({ historial, onSelect, onLimpiar }) {
  if (historial.length === 0) {
    return (
      <div className="hist-empty">
        <p>Todavía no ejecutaste ninguna simulación en esta sesión.</p>
        <p className="subtle">Presioná “Simular” y las corridas van a aparecer acá.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hist-list">
        {historial.map((h) => {
          const r = h.results
          const ok = !r.decision.superaUmbral
          return (
            <button type="button" key={h.id} className="hist-item" onClick={() => onSelect(h.id)}>
              <div className="hist-item__top">
                <span className="hist-item__num">Simulación #{h.numero}</span>
                <span className={`hist-chip ${ok ? 'hist-chip--ok' : 'hist-chip--alert'}`}>
                  {ok ? '✓ En capacidad' : '⚠ Supera umbral'}
                </span>
              </div>
              <span className="hist-item__date subtle">{fmtFecha(h.timestamp)}</span>
              <div className="hist-item__stats">
                <span>📽️ {fmt(r.totalProyectores, 0)} proyectores</span>
                <span>⏱️ {fmt(minToHoras(r.tiempoTotalRevision), 2)} h</span>
                <span className="subtle">semilla {r.seed}</span>
              </div>
            </button>
          )
        })}
      </div>
      <footer className="hist-panel__foot">
        <button type="button" className="btn-ghost" onClick={onLimpiar}>Vaciar historial</button>
      </footer>
    </>
  )
}

/* ── Vista DETALLE ───────────────────────────────────────── */
function Detalle({ entry }) {
  const r = entry.results
  const total = r.totalProyectores || 0
  const ok = !r.decision.superaUmbral

  return (
    <div className="hist-detalle">
      <div className="hist-detalle__head">
        <h3>Simulación #{entry.numero}</h3>
        <span className="subtle">{fmtFecha(entry.timestamp)}</span>
      </div>

      <dl className="hist-params">
        <div><dt>Semilla</dt><dd>{r.seed}</dd></div>
        <div><dt>Horizonte</dt><dd>{r.config.dias} días</dd></div>
        <div><dt>α (llegadas/día)</dt><dd>{fmt(r.config.tasaLlegadas, 2)}</dd></div>
        <div><dt>Umbral</dt><dd>{fmt(minToHoras(r.decision.umbral), 0)} h</dd></div>
      </dl>

      <div className="hist-metrics">
        <Metric label="Proyectores" value={`${fmt(total, 0)}`} unit="unidades" />
        <Metric label="Carga total" value={fmt(minToHoras(r.tiempoTotalRevision), 2)} unit="h" />
        <Metric label="Triaje" value={fmt(minToHoras(r.tiempoTriajeTotal), 2)} unit="h" />
        <Metric label="Servicio" value={fmt(minToHoras(r.tiempoServicioTotal), 2)} unit="h" />
        <Metric label="Mercurio" value={fmt(r.mercurioRecuperado, 2)} unit="µg/L" />
        <Metric label="Materiales" value={fmt(r.materialesRecuperados, 2)} unit="g" />
      </div>

      <h4 className="hist-subtitle">Derivación por estación</h4>
      <div className="hist-rutas">
        {r.conteoRutas.map((c, i) => {
          const pct = total ? (100 * c) / total : 0
          return (
            <div className="hist-ruta" key={i}>
              <span className="hist-ruta__name">{ICONOS_RUTA[i]} {NOMBRES_RUTA[i]}</span>
              <span className="hist-ruta__val">{fmt(c, 0)} <span className="subtle">({fmt(pct, 1)}%)</span></span>
            </div>
          )
        })}
      </div>

      <div className={`hist-decision ${ok ? 'hist-decision--ok' : 'hist-decision--alert'}`}>
        <strong>{ok ? '✓ Dentro de la capacidad operativa' : '⚠ Supera el umbral de capacidad'}</strong>
        <span>
          {fmt(minToHoras(r.tiempoTotalRevision), 2)} h {ok ? '≤' : '>'} {fmt(minToHoras(r.decision.umbral), 2)} h
        </span>
      </div>

      <button type="button" className="btn-primary hist-pdf" onClick={() => abrirReportePDF(entry)}>
        📄 Descargar reporte PDF
      </button>
    </div>
  )
}

function Metric({ label, value, unit }) {
  return (
    <div className="hist-metric">
      <span className="hist-metric__label">{label}</span>
      <span className="hist-metric__value">{value} <span className="hist-metric__unit">{unit}</span></span>
    </div>
  )
}
