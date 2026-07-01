/**
 * Utilidades compartidas para mostrar resultados y generar reportes.
 * Centraliza el formateo, los nombres/íconos de las estaciones, la
 * persistencia del historial por sesión y la exportación a PDF.
 */

// Nombres e íconos de las estaciones (mismo orden que config.probabilidades).
export const NOMBRES_RUTA = ['Reacondicionamiento', 'Desensamblaje', 'Descontaminación', 'Almacenamiento']
export const ICONOS_RUTA = ['🔧', '🔩', '🧪', '📦']

// Formatea un número al estilo argentino (coma decimal, punto de miles).
export const fmt = (n, d = 2) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

// El motor trabaja en minutos; la interfaz muestra horas laborales.
export const minToHoras = (min) => min / 60

// Fecha/hora legible de una corrida.
export const fmtFecha = (ts) =>
  new Date(ts).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

/* ── Persistencia del historial (por sesión del navegador) ───────────── */
const STORAGE_KEY = 'electrogreem_historial'
const MAX_HISTORIAL = 50

export function cargarHistorial() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function guardarHistorial(historial) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(historial.slice(0, MAX_HISTORIAL)))
  } catch {
    /* almacenamiento no disponible: el historial queda solo en memoria */
  }
}

/* ── Reporte en PDF (vía diálogo de impresión del navegador) ──────────── */

/**
 * Arma un documento HTML imprimible con el detalle de una simulación y lo
 * abre en una pestaña nueva, disparando el diálogo de impresión. Desde ahí
 * el usuario puede elegir "Guardar como PDF". No requiere dependencias.
 *
 * @param {{ numero:number, timestamp:number, results:object }} entry
 */
export function abrirReportePDF(entry) {
  const r = entry.results
  const total = r.totalProyectores || 0

  const filasRutas = r.conteoRutas
    .map((c, i) => {
      const pct = total ? (100 * c) / total : 0
      const teo = 100 * r.config.probabilidades[i]
      return `<tr>
        <td>${ICONOS_RUTA[i]} ${NOMBRES_RUTA[i]}</td>
        <td class="num">${fmt(c, 0)}</td>
        <td class="num">${fmt(pct, 1)}%</td>
        <td class="num muted">${fmt(teo, 0)}%</td>
      </tr>`
    })
    .join('')

  const filasDias = r.logDiario
    .map((d) => `<tr>
      <td class="num">${d.dia}</td>
      <td class="num">${fmt(d.llegadas, 0)}</td>
      <td class="num">${fmt(minToHoras(d.tiempoDia), 2)}</td>
    </tr>`)
    .join('')

  const decisionOk = !r.decision.superaUmbral

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de simulación #${entry.numero} — ElectroGreem S.R.L.</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, 'Segoe UI', Roboto, sans-serif; color: #16171d; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 15px; margin: 26px 0 10px; border-bottom: 2px solid #149a4f; padding-bottom: 4px; color: #0d5a2f; }
  .sub { color: #555; font-size: 13px; margin: 0; }
  .meta { margin: 14px 0 0; font-size: 13px; color: #333; }
  .meta span { display: inline-block; margin-right: 18px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; }
  .card .k { font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #666; }
  .card .v { font-size: 19px; font-weight: 700; margin-top: 3px; }
  .card .v small { font-size: 12px; font-weight: 400; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e3e3e3; }
  th { background: #f4f3ec; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
  td.num, th.num { text-align: right; }
  .muted { color: #888; }
  .banner { margin-top: 8px; padding: 12px 14px; border-radius: 8px; font-size: 13px; }
  .banner.ok { background: rgba(34,170,110,.12); border: 1px solid rgba(34,170,110,.5); }
  .banner.alert { background: rgba(228,90,90,.12); border: 1px solid rgba(228,90,90,.5); }
  .banner strong { display: block; margin-bottom: 4px; font-size: 14px; }
  footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #e3e3e3; padding-top: 8px; }
  @media print { body { margin: 12mm; } h2 { page-break-after: avoid; } tr { page-break-inside: avoid; } }
</style>
</head>
<body>
  <h1>Reporte de simulación #${entry.numero}</h1>
  <p class="sub">Planta ElectroGreem S.R.L. — Tratamiento de proyectores RAEE</p>
  <p class="meta">
    <span><strong>Fecha:</strong> ${fmtFecha(entry.timestamp)}</span>
    <span><strong>Semilla:</strong> ${r.seed}</span>
    <span><strong>Horizonte:</strong> ${r.config.dias} días</span>
    <span><strong>α (llegadas/día):</strong> ${fmt(r.config.tasaLlegadas, 2)}</span>
  </p>

  <h2>Resumen del mes</h2>
  <div class="grid">
    <div class="card"><div class="k">Proyectores procesados</div><div class="v">${fmt(total, 0)} <small>unidades</small></div></div>
    <div class="card"><div class="k">Carga de trabajo total</div><div class="v">${fmt(minToHoras(r.tiempoTotalRevision), 2)} <small>h · ${fmt(r.tiempoTotalRevision, 0)} min</small></div></div>
    <div class="card"><div class="k">Triaje acumulado</div><div class="v">${fmt(minToHoras(r.tiempoTriajeTotal), 2)} <small>h</small></div></div>
    <div class="card"><div class="k">Servicio acumulado</div><div class="v">${fmt(minToHoras(r.tiempoServicioTotal), 2)} <small>h</small></div></div>
    <div class="card"><div class="k">Mercurio recuperado</div><div class="v">${fmt(r.mercurioRecuperado, 2)} <small>µg/L</small></div></div>
    <div class="card"><div class="k">Materiales recuperados</div><div class="v">${fmt(r.materialesRecuperados, 2)} <small>g</small></div></div>
  </div>

  <h2>Derivación por estación</h2>
  <table>
    <thead><tr><th>Estación</th><th class="num">Proyectores</th><th class="num">% real</th><th class="num">% teórico</th></tr></thead>
    <tbody>${filasRutas}</tbody>
  </table>

  <h2>Decisión gerencial</h2>
  <div class="banner ${decisionOk ? 'ok' : 'alert'}">
    <strong>${decisionOk ? '✓ Dentro de la capacidad operativa' : '⚠ Supera el umbral de capacidad'}</strong>
    ${fmt(minToHoras(r.tiempoTotalRevision), 2)} h ${decisionOk ? '≤' : '>'} ${fmt(minToHoras(r.decision.umbral), 2)} h de umbral.
    <br />${r.decision.recomendacion}
  </div>

  <h2>Llegadas por día</h2>
  <table>
    <thead><tr><th class="num">Día</th><th class="num">Proyectores</th><th class="num">Tiempo (h)</th></tr></thead>
    <tbody>${filasDias}</tbody>
  </table>

  <footer>Generado por el Simulador ElectroGreem S.R.L. · ${fmtFecha(Date.now())}</footer>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Tu navegador bloqueó la ventana emergente. Permití las ventanas emergentes para generar el PDF.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
