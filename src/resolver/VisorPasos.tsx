import { Suspense, lazy, useEffect, useState } from 'react'
import { conceptos } from '../content/concepts'
import { final, rangoPara, type Saltos } from '../lessons/ley-de-signos/saltos'
import type { Paso, Visual } from '../motores/tipos'
import { href, rutas } from '../router'
import { ExpresionAnimada } from '../ui/ExpresionAnimada'
import { dur } from '../ui/movimiento'
import { usePrefersReducedMotion } from '../ui/useReducedMotion'
import './Pasos.css'

// La recta (Mafs y GSAP) pesa: se carga solo cuando un paso la usa.
const RectaNumerica = lazy(() => import('../ui/RectaNumerica').then((m) => ({ default: m.RectaNumerica })))

const menos = (n: number) => (n < 0 ? `−${-n}` : `${n}`)

/** La recta en palabras, para lectores de pantalla. */
function describirRecta(m: Saltos): string {
  const fin = final(m)
  const paso = Math.abs(fin - m.inicio)
  if (paso === 0) return `Recta numérica: empiezas en ${menos(m.inicio)} y te quedas ahí.`
  const lado = fin > m.inicio ? 'derecha' : 'izquierda'
  return `Recta numérica: empiezas en ${menos(m.inicio)}, te mueves ${paso} hacia la ${lado} y llegas a ${menos(fin)}.`
}

function Dibujo({ visual, repetir }: { visual: Visual; repetir: number }) {
  if (visual.tipo !== 'recta') return null
  const modelo: Saltos = { inicio: visual.inicio, saltos: visual.saltos, voltear: visual.voltear }
  return (
    <div className="pasos-visual">
      <p className="pasos-visual-titulo">En la recta numérica</p>
      <Suspense fallback={<p className="sr-only">{describirRecta(modelo)}</p>}>
        <RectaNumerica modelo={modelo} rango={rangoPara(modelo)} repetir={repetir} descripcion={describirRecta(modelo)} />
      </Suspense>
    </div>
  )
}

/** Botones del árbol del porqué: cada uno abre la mini lección de su tema. */
export function Temas({ paso, problema }: { paso: Paso; problema: string }) {
  return (
    <div className="pasos-temas">
      <span className="pasos-temas-titulo">¿Por qué? Repasa:</span>
      <ul>
        {paso.conceptos.map((c) => (
          <li key={c}>
            <a className="pasos-tema" href={href(rutas.resolver(problema, [c]))}>
              {conceptos[c].nombre}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Un paso a la vez. Al llegar a un paso, la expresión pasa sola por sus
 * momentos (antes → después) y los términos viajan a su lugar nuevo. Con
 * "reducir movimiento" se muestra directo el último momento.
 */
export function VisorPasos({
  pasos,
  problema,
  indice,
  alCambiar,
}: {
  pasos: Paso[]
  problema: string
  indice: number
  alCambiar: (i: number) => void
}) {
  const reducir = usePrefersReducedMotion()
  const [rep, setRep] = useState(0)
  const paso = pasos[indice]
  const n = paso.frames.length
  const clave = `${indice}-${rep}`
  // `clave` dice a qué paso y repetición corresponde el momento guardado.
  const [momento, setMomento] = useState({ clave: '', f: 0 })
  const f = reducir ? n - 1 : momento.clave === clave ? momento.f : 0

  useEffect(() => {
    if (reducir) return
    const relojes = Array.from({ length: n - 1 }, (_, k) =>
      window.setTimeout(() => setMomento({ clave, f: k + 1 }), (k + 1) * dur.pausa * 1000),
    )
    return () => relojes.forEach((r) => window.clearTimeout(r))
  }, [clave, n, reducir])

  const ultimo = indice === pasos.length - 1

  return (
    <div className="pasos">
      <div className="pasos-principal">
        <p className="pasos-cuenta">
          Paso {indice + 1} de {pasos.length}
        </p>
        <div aria-live="polite">
          <h3 className="pasos-titulo">{paso.titulo}</h3>
        </div>
        <div className="pasos-expresion">
          <ExpresionAnimada frame={paso.frames[f]} grande />
        </div>
        <p className="pasos-explicacion">{paso.explicacion}</p>
        {paso.nota && <p className="pasos-nota">{paso.nota}</p>}
        <Temas paso={paso} problema={problema} />
      </div>

      <aside className="pasos-lado" aria-label="Dibujo y lista de pasos">
        {paso.visual && <Dibujo visual={paso.visual} repetir={indice * 1000 + rep} />}
        <div className="pasos-mapa">
          <p className="pasos-visual-titulo">Todos los pasos</p>
          <MapaPasos pasos={pasos} actual={indice} alElegir={alCambiar} />
        </div>
      </aside>

      <div className="pasos-botones">
        <button type="button" className="boton boton-chico boton-secundario" disabled={indice === 0} onClick={() => alCambiar(indice - 1)}>
          Anterior
        </button>
        <button type="button" className="boton boton-chico" disabled={ultimo} onClick={() => alCambiar(indice + 1)}>
          Siguiente
        </button>
        {!reducir && n > 1 && (
          <button type="button" className="boton-texto" onClick={() => setRep((r) => r + 1)}>
            Ver otra vez
          </button>
        )}
      </div>
    </div>
  )
}

function MapaPasos({ pasos, actual, alElegir }: { pasos: Paso[]; actual?: number; alElegir: (i: number) => void }) {
  return (
    <ol className="pasos-lista-ol">
      {pasos.map((p, i) => (
        <li key={i} className={i === actual ? 'pasos-lista-actual' : undefined}>
          <button type="button" className="pasos-lista-titulo" aria-current={i === actual ? 'step' : undefined} onClick={() => alElegir(i)}>
            {p.titulo}
          </button>
          <ExpresionAnimada frame={{ expr: p.frames[p.frames.length - 1].expr }} />
        </li>
      ))}
    </ol>
  )
}

/** Todos los pasos de una vez, para repasar o para quien prefiere leer (en el teléfono). */
export function ListaPasos({ pasos, alElegir }: { pasos: Paso[]; alElegir: (i: number) => void }) {
  return (
    <details className="pasos-lista">
      <summary>Ver todos los pasos juntos</summary>
      <MapaPasos pasos={pasos} alElegir={alElegir} />
    </details>
  )
}
