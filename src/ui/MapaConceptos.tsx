import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { conceptos, type ConceptoId } from '../content/concepts'
import { ordenTopologico } from '../content/grafo'
import { ALTO_MAPA, ANCHO_MAPA, posiciones } from '../content/mapa'
import type { EstadoMapa } from '../diagnostic/machine'
import { usePrefersReducedMotion } from './useReducedMotion'
import './MapaConceptos.css'

/** Línea un poco curva, como trazada a mano. La curva depende de los puntos, así siempre sale igual. */
function trazo(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const largo = Math.hypot(dx, dy) || 1
  const curva = ((a.x * 7 + b.y * 3) % 2 === 0 ? 1 : -1) * 9
  return `M${a.x} ${a.y} Q ${mx + (-dy / largo) * curva} ${my + (dx / largo) * curva} ${b.x} ${b.y}`
}

const R = 13

export function MapaConceptos({ estados, inicio }: { estados: Record<ConceptoId, EstadoMapa>; inicio: ConceptoId | null }) {
  const raiz = useRef<SVGSVGElement>(null)
  const reducir = usePrefersReducedMotion()
  const orden = useMemo(() => ordenTopologico(), [])

  useLayoutEffect(() => {
    const svg = raiz.current
    if (!svg || reducir) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 })
      // Se dibuja desde la base hacia arriba: primero las líneas que llegan, luego el concepto.
      for (const id of orden) {
        const lineas = svg.querySelectorAll<SVGPathElement>(`.mapa-linea[data-hacia="${id}"]`)
        lineas.forEach((l) => {
          const n = l.getTotalLength()
          gsap.set(l, { strokeDasharray: n, strokeDashoffset: n })
        })
        if (lineas.length) tl.to(lineas, { strokeDashoffset: 0, duration: 0.28, ease: 'power1.inOut' }, '-=0.05')
        tl.from(`.mapa-nodo[data-id="${id}"]`, { scale: 0, transformOrigin: 'center', duration: 0.22, ease: 'back.out(2.5)' }, '-=0.08')
      }
      const circulo = svg.querySelector<SVGPathElement>('.mapa-aqui-circulo')
      if (circulo) {
        const n = circulo.getTotalLength()
        tl.fromTo(circulo, { strokeDasharray: n, strokeDashoffset: n }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.15')
        tl.from('.mapa-aqui-texto', { opacity: 0, y: 6, duration: 0.3 })
      }
    }, svg)
    return () => ctx.revert()
  }, [reducir, orden])

  const pIni = inicio ? posiciones[inicio] : null
  const aqui = pIni && {
    derecha: pIni.x < ANCHO_MAPA / 2,
    // Círculo de pluma roja alrededor del punto de inicio, que no cierra perfecto.
    circulo: `M${pIni.x + 24} ${pIni.y - 6} C ${pIni.x + 26} ${pIni.y - 30}, ${pIni.x - 28} ${pIni.y - 28}, ${pIni.x - 25} ${pIni.y + 2} S ${pIni.x + 22} ${pIni.y + 30}, ${pIni.x + 21} ${pIni.y - 12}`,
  }

  return (
    <svg
      ref={raiz}
      className="mapa"
      viewBox={`0 0 ${ANCHO_MAPA} ${ALTO_MAPA}`}
      role="img"
      aria-labelledby="mapa-titulo mapa-desc"
    >
      <title id="mapa-titulo">Mapa de conceptos</title>
      <desc id="mapa-desc">
        {orden
          .map((id) => `${conceptos[id].nombre}: ${estados[id] === 'dominado' ? 'dominado' : estados[id] === 'siguiente' ? 'por aprender' : 'bloqueado'}`)
          .join('. ')}
      </desc>

      {orden.flatMap((id) =>
        conceptos[id].prerrequisitos.map((p) => (
          <path
            key={`${p}-${id}`}
            className={`mapa-linea ${estados[p] === 'dominado' ? 'mapa-linea-firme' : 'mapa-linea-lapiz'}`}
            data-hacia={id}
            d={trazo(posiciones[p], posiciones[id])}
          />
        )),
      )}

      {orden.map((id) => {
        const { x, y } = posiciones[id]
        const e = estados[id]
        return (
          <g key={id} className={`mapa-nodo mapa-${e}`} data-id={id}>
            <circle cx={x} cy={y} r={R} />
            {e === 'dominado' && <path className="mapa-check" d={`M${x - 6} ${y} L${x - 1.5} ${y + 5} L${x + 6.5} ${y - 5}`} />}
            {/* Fondo de papel detrás del nombre, para que las líneas no lo crucen. */}
            <rect className="mapa-fondo-texto" x={x - conceptos[id].corto.length * 3.9 - 4} y={y + R + 4} width={conceptos[id].corto.length * 7.8 + 8} height={18} rx={4} />
            <text x={x} y={y + R + 17}>
              {conceptos[id].corto}
            </text>
          </g>
        )
      })}

      {pIni && aqui && (
        <g className="mapa-aqui">
          <path className="mapa-aqui-circulo" d={aqui.circulo} />
          <text
            className="mapa-aqui-texto"
            x={aqui.derecha ? pIni.x + 32 : pIni.x - 32}
            y={pIni.y - 14}
            textAnchor={aqui.derecha ? 'start' : 'end'}
          >
            empieza aquí
          </text>
        </g>
      )}
    </svg>
  )
}

/** Muestra pequeña de cada estado, para la leyenda. */
export function MuestraEstado({ estado }: { estado: EstadoMapa }) {
  return (
    <svg className={`mapa-muestra mapa-${estado}`} width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx={12} cy={12} r={9} />
      {estado === 'dominado' && <path className="mapa-check" d="M8 12 L11 15 L16.5 9" />}
    </svg>
  )
}
