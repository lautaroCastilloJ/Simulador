import './reactbits.css'

/**
 * FadeContent (React Bits) — muestra su contenido con un desvanecido suave y
 * un leve desplazamiento hacia arriba al montarse. Versión sin dependencias
 * (animación CSS). Útil para que los bloques de resultados "aparezcan".
 *
 * @param {object}   props
 * @param {React.ReactNode} props.children   Contenido a revelar.
 * @param {number}   [props.delay=0]         Retardo antes de animar, en ms (para escalonar).
 * @param {number}   [props.duration=600]    Duración del desvanecido, en ms.
 * @param {string}   [props.className='']    Clases extra opcionales.
 */
export default function FadeContent({ children, delay = 0, duration = 600, className = '' }) {
  return (
    <div
      className={`rb-fade-content ${className}`}
      style={{ animationDuration: `${duration}ms`, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
