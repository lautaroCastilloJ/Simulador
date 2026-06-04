import './reactbits.css'

/**
 * ShinyText (React Bits) — texto con una banda de brillo que lo recorre.
 * Versión sin dependencias y adaptada al tema (claro/oscuro) del simulador.
 *
 * @param {object} props
 * @param {string} props.text          Texto a mostrar.
 * @param {number} [props.speed=5]     Duración del recorrido del brillo, en segundos.
 * @param {string} [props.className=''] Clases extra opcionales.
 */
export default function ShinyText({ text, speed = 5, className = '' }) {
  return (
    <span
      className={`rb-shiny-text ${className}`}
      style={{ animationDuration: `${speed}s` }}
    >
      {text}
    </span>
  )
}
