import { useEffectEvent, useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { Mafs, MovablePoint, useTransformContext, vec } from 'mafs'
import 'mafs/core.css'
import { puntos, type Saltos } from '../lessons/ley-de-signos/saltos'
import { usePrefersReducedMotion } from './useReducedMotion'
import './RectaNumerica.css'

type Cuadro = { dibujo: number; s: number; llegada: number }

const ALTO = 128
/** La recta está un poco abajo del centro para dejar lugar a los arcos. */
const Y_RECTA = -0.45

const menos = (n: number) => (n < 0 ? `−${-n}` : `${n}`)
const conSigno = (n: number) => (n < 0 ? `−${-n}` : `+${n}`)

function Dibujo({ modelo, rango, cuadro, arrastrable }: { modelo: Saltos; rango: [number, number]; cuadro: Cuadro; arrastrable: boolean }) {
  const { viewTransform: m } = useTransformContext()
  const px = (x: number, y = Y_RECTA) => vec.transform([x, y], m)
  const [lo, hi] = rango
  const [, yRecta] = px(0)
  const unidad = px(1)[0] - px(0)[0]

  const { inicio, saltos } = modelo
  const fin = puntos(modelo).at(-1)!
  const destacados = cuadro.llegada > 0 ? [inicio, fin] : [inicio]
  const cada = unidad >= 22 ? 1 : unidad >= 11 ? 2 : 5
  const etiquetas: number[] = []
  for (let n = Math.ceil(lo); n <= hi; n++) {
    if (n % cada !== 0 && n !== 0) continue
    if (destacados.some((d) => Math.abs(d - n) * unidad < 26)) continue
    if ((n - lo) * unidad < 12 || (hi - n) * unidad < 12) continue
    etiquetas.push(n)
  }

  // Un arco por salto. Con s = 1 van como se escribieron; con s = -1, volteados.
  const arcos = (s: number, fantasma: boolean) => {
    let x = inicio
    return saltos.map((t, i) => {
      const p = fantasma ? 1 : Math.min(1, Math.max(0, cuadro.dibujo - i))
      const x0 = x
      const x1 = x + s * t
      x = x1
      if (p <= 0) return null
      const [X0] = px(x0)
      const [X1] = px(x1)
      const ancho = X1 - X0
      const h = Math.min(44, Math.abs(ancho) * 0.55 + 4)
      const cx = (X0 + X1) / 2
      const cy = yRecta - 6 - 2 * h
      const d = `M${X0} ${yRecta - 6} Q ${cx} ${cy} ${X1} ${yRecta - 6}`
      // Punta: sigue la dirección del arco al llegar.
      const dir = vec.normalize([X1 - cx, yRecta - 6 - cy])
      const lado: vec.Vector2 = [-dir[1], dir[0]]
      const tip: vec.Vector2 = [X1, yRecta - 6]
      const a = vec.add(vec.add(tip, vec.scale(dir, -9)), vec.scale(lado, 5))
      const b = vec.add(vec.add(tip, vec.scale(dir, -9)), vec.scale(lado, -5))
      const volteado = s < 0
      const valor = Math.round(s * t)
      return (
        <g key={i} className={fantasma ? 'recta-fantasma' : volteado ? 'recta-salto recta-volteado' : 'recta-salto'}>
          <path d={d} pathLength={1} strokeDasharray={fantasma ? undefined : `${p} 2`} />
          {(fantasma || p >= 0.98) && Math.abs(ancho) > 3 && <path className="recta-punta" d={`M${a[0]} ${a[1]} L${tip[0]} ${tip[1]} L${b[0]} ${b[1]}`} />}
          {!fantasma && p >= 0.98 && Math.abs(s) > 0.6 && Math.abs(ancho) >= 20 && (
            <text className="recta-valor" x={cx} y={yRecta - 10 - h}>
              {conSigno(valor)}
            </text>
          )}
        </g>
      )
    })
  }

  const [xFin] = px(fin)
  return (
    <g className="recta">
      <line className="recta-eje" x1={px(lo)[0]} y1={yRecta} x2={px(hi)[0]} y2={yRecta} />
      {Array.from({ length: Math.floor(hi) - Math.ceil(lo) + 1 }, (_, i) => Math.ceil(lo) + i)
        .filter((n) => unidad >= 7 || n % 5 === 0)
        .map((n) => (
        <line key={n} className={n === 0 ? 'recta-cero' : 'recta-tic'} x1={px(n)[0]} x2={px(n)[0]} y1={yRecta - (n === 0 ? 7 : 4)} y2={yRecta + (n === 0 ? 7 : 4)} />
      ))}
      {etiquetas.map((n) => (
        <text key={n} className="recta-numero" x={px(n)[0]} y={yRecta + 22}>
          {menos(n)}
        </text>
      ))}

      {modelo.voltear && cuadro.s < 0.999 && arcos(1, true)}
      {arcos(cuadro.s, false)}

      {cuadro.llegada > 0 && (
        <g className="recta-llegada" style={{ opacity: Math.min(1, cuadro.llegada) }}>
          <ellipse cx={xFin} cy={yRecta + 13} rx={6 + 10 * cuadro.llegada} ry={4 + 9 * cuadro.llegada} />
          <text className="recta-numero recta-destacado" x={xFin} y={yRecta + 22}>
            {menos(fin)}
          </text>
        </g>
      )}
      <text className="recta-numero recta-destacado recta-inicio-n" x={px(inicio)[0]} y={yRecta + 22}>
        {menos(inicio)}
      </text>
      {!arrastrable && <circle className="recta-inicio" cx={px(inicio)[0]} cy={yRecta} r={6} />}
    </g>
  )
}

/**
 * Recta numérica de la lección. Dibuja los saltos de `modelo` con una
 * secuencia: primero cada salto, después (si hay un menos) los voltea, y al
 * final encierra el resultado. Se repite cada vez que cambia `repetir`.
 */
export function RectaNumerica({
  modelo,
  rango,
  repetir,
  descripcion,
  alMoverInicio,
  limitesInicio,
  alTerminar,
}: {
  modelo: Saltos
  rango: [number, number]
  repetir: number
  descripcion: string
  /** Si se pasa, el punto de inicio se puede arrastrar. */
  alMoverInicio?: (n: number) => void
  limitesInicio?: readonly [number, number]
  alTerminar?: () => void
}) {
  const reducir = usePrefersReducedMotion()
  // `rep` dice a qué valor de `repetir` corresponde el cuadro; si no coincide, la animación está por empezar.
  const [anim, setAnim] = useState<{ rep: number; cuadro: Cuadro | null }>({ rep: Number.NaN, cuadro: null })
  const terminar = useEffectEvent(() => alTerminar?.())
  const saltosAhora = useEffectEvent(() => ({ n: modelo.saltos.length, voltear: modelo.voltear }))

  useLayoutEffect(() => {
    if (reducir) {
      terminar()
      return
    }
    const { n, voltear } = saltosAhora()
    const obj: Cuadro = { dibujo: 0, s: 1, llegada: 0 }
    const tl = gsap.timeline({
      delay: 0.15,
      onUpdate: () => setAnim({ rep: repetir, cuadro: { ...obj } }),
      onComplete: () => {
        setAnim({ rep: repetir, cuadro: null })
        terminar()
      },
    })
    tl.to(obj, { dibujo: n, duration: n === 1 ? 0.7 : Math.min(2.4, n * 0.38), ease: n === 1 ? 'power1.inOut' : 'none' })
    if (voltear) tl.to(obj, { s: -1, duration: 0.75, ease: 'power2.inOut' }, '+=0.4')
    tl.to(obj, { llegada: 1, duration: 0.35, ease: 'back.out(2)' }, '+=0.1')
    return () => {
      tl.kill()
    }
  }, [repetir, reducir])

  const inicial: Cuadro = { dibujo: 0, s: 1, llegada: 0 }
  const cuadro = reducir ? null : anim.rep !== repetir ? inicial : anim.cuadro
  const quieto: Cuadro = { dibujo: modelo.saltos.length, s: modelo.voltear ? -1 : 1, llegada: 1 }
  const [minI, maxI] = limitesInicio ?? rango

  return (
    <figure className="recta-figura">
      <Mafs height={ALTO} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{ x: rango, y: [-1, 1], padding: 0 }}>
        <Dibujo modelo={modelo} rango={rango} cuadro={cuadro ?? quieto} arrastrable={!!alMoverInicio} />
        {alMoverInicio && (
          <MovablePoint
            point={[modelo.inicio, Y_RECTA]}
            color="var(--tinta)"
            constrain={([x]) => [Math.min(maxI, Math.max(minI, Math.round(x))), Y_RECTA]}
            onMove={([x]) => {
              if (x !== modelo.inicio) alMoverInicio(x)
            }}
          />
        )}
      </Mafs>
      <figcaption className="sr-only" aria-live="polite">
        {descripcion}
      </figcaption>
    </figure>
  )
}
