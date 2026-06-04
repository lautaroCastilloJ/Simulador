import { useEffect, useRef, useState } from 'react'

/**
 * CountUp (React Bits) — anima un número desde "from" hasta "to".
 * Versión sin dependencias: usa requestAnimationFrame para la animación y
 * IntersectionObserver para arrancar recién cuando el número entra en pantalla.
 *
 * @param {object}   props
 * @param {number}   props.to                 Valor final al que cuenta.
 * @param {number}   [props.from=0]           Valor inicial.
 * @param {number}   [props.duration=1.1]     Duración de la animación, en segundos.
 * @param {(v:number)=>string} [props.format] Formatea el valor mostrado (p. ej. fmt).
 * @param {string}   [props.className='']     Clases extra opcionales.
 */
export default function CountUp({ to, from = 0, duration = 1.1, format, className = '' }) {
  const [value, setValue] = useState(from)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let rafId
    let started = false

    // Si el usuario prefiere menos movimiento, no animamos: mostramos el final.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const run = () => {
      if (started) return
      started = true
      if (prefersReduced) {
        setValue(to)
        return
      }
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min((now - t0) / (duration * 1000), 1)
        const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
        setValue(from + (to - from) * eased)
        if (p < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) run() }),
      { threshold: 0.2 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [to, from, duration])

  const display = format ? format(value) : String(Math.round(value))

  return <span ref={ref} className={className}>{display}</span>
}
