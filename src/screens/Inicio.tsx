import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { href, rutas } from '../router'
import { usePrefersReducedMotion } from '../ui/useReducedMotion'
import { site } from '../config/site'
import './Inicio.css'

/** Recta numérica dibujada a mano: -3 + 5 = 2. Es el único momento animado de la portada. */
function Boceto() {
  const raiz = useRef<SVGSVGElement>(null)
  const reducir = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const svg = raiz.current
    if (!svg || reducir) return
    const ctx = gsap.context(() => {
      const arco = svg.querySelector<SVGPathElement>('.arco')!
      const largo = arco.getTotalLength()
      gsap
        .timeline({ delay: 0.3 })
        .from('.recta', { scaleX: 0, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' })
        .from('.marca', { opacity: 0, y: 4, stagger: 0.04, duration: 0.2 }, '-=0.2')
        .from('.inicio', { scale: 0, transformOrigin: 'center', duration: 0.25, ease: 'back.out(3)' })
        .fromTo(arco, { strokeDashoffset: largo, strokeDasharray: largo }, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' })
        .from('.punta', { opacity: 0, duration: 0.1 }, '-=0.1')
        .from('.fin', { scale: 0, transformOrigin: 'center', duration: 0.3, ease: 'back.out(3)' })
        .from('.etiqueta', { opacity: 0, y: 6, duration: 0.3 }, '-=0.1')
        .from('.subrayado', { scaleX: 0, transformOrigin: 'left center', duration: 0.35, ease: 'power2.out' })
    }, svg)
    return () => ctx.revert()
  }, [reducir])

  // Escala: 1 unidad = 28px, 0 en x=112.
  const x = (n: number) => 112 + n * 28
  const nums = [-3, -2, -1, 0, 1, 2, 3, 4]

  return (
    <svg ref={raiz} className="boceto" viewBox="0 0 280 140" role="img" aria-labelledby="boceto-t">
      <title id="boceto-t">Recta numérica: desde -3 se avanzan 5 pasos y se llega a 2.</title>
      <g transform="translate(0 20)">
      <path className="recta" d="M8 86 L272 86" />
      {nums.map((n) => (
        <g key={n} className="marca">
          <line x1={x(n)} y1={80} x2={x(n)} y2={92} />
          <text x={x(n)} y={110}>{n}</text>
        </g>
      ))}
      <path className="arco" d={`M${x(-3)} 78 Q ${x(-0.5)} 18 ${x(2)} 78`} />
      <path className="punta" d={`M${x(2) - 9} 68 L${x(2)} 78 L${x(2) + 3} 66`} />
      <circle className="inicio" cx={x(-3)} cy={86} r={5} />
      <circle className="fin" cx={x(2)} cy={86} r={7} />
      <text className="etiqueta" x={x(-0.5)} y={38}>+5</text>
      </g>
      <g className="ecuacion">
        <text x={8} y={22}>−3 + 5 = 2</text>
        <path className="subrayado" d="M6 30 Q 50 26 104 31" />
      </g>
    </svg>
  )
}

export function Inicio() {
  return (
    <main className="hoja inicio-pagina">
      <h1 className="inicio-titulo">Matemática desde la base</h1>
      <Boceto />

      <p className="inicio-texto">
        Si te pierdes en álgebra o cálculo, casi siempre es por una base: los signos, las fracciones, los exponentes.
        Responde unas 12 preguntas y te decimos cuál te falta.
      </p>
      <p className="inicio-texto">Después aprendes solo eso, practicando, sin páginas de teoría.</p>

      <div className="inicio-acciones">
        <a className="boton" href={href(rutas.diagnostico)}>
          Empezar el diagnóstico
        </a>
        <a className="boton-texto" href={href(rutas.leccion('ley-de-signos'))}>
          Ir directo a la lección de ley de signos
        </a>
      </div>

      <p className="inicio-nota">Gratis, sin cuenta. Tu avance se guarda en este teléfono.</p>

      <footer className="inicio-pie">
        <a className="boton-texto" href={site.sugerencias.url} target="_blank" rel="noopener noreferrer">
          Mandar una sugerencia
        </a>
      </footer>
    </main>
  )
}
