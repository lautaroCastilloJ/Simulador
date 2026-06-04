import './reactbits.css'

/**
 * GradientText (React Bits) — texto con degradado animado.
 * Versión sin dependencias: el degradado se recorta sobre el texto y se
 * desplaza con una animación CSS infinita.
 *
 * @param {object}   props
 * @param {React.ReactNode} props.children       Texto a mostrar.
 * @param {string[]} [props.colors]              Colores del degradado.
 * @param {number}   [props.animationSpeed=8]    Duración del ciclo, en segundos.
 * @param {string}   [props.className='']        Clases extra opcionales.
 */
export default function GradientText({
  children,
  colors = ['#149a4f', '#4ade80', '#2dd4bf', '#149a4f'],
  animationSpeed = 8,
  className = '',
}) {
  const style = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
  }

  return (
    <span className={`rb-gradient-text ${className}`} style={style}>
      {children}
    </span>
  )
}
