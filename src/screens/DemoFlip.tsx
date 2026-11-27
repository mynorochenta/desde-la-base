import { useState } from 'react'
import { igual, letra, neg, num, producto, resta, suma } from '../expr/construir'
import type { Frame } from '../motores/tipos'
import { ExpresionAnimada } from '../ui/ExpresionAnimada'

/**
 * Solo en desarrollo (npm run dev): prueba del componente FLIP con frames
 * armados a mano. No es una solución de un motor; los motores llegan en la
 * etapa 2. Los ids iguales entre frames son los términos que se deslizan.
 */
const dosX = () => producto('p1', num('a1', 2), letra('x1', 'x'), 'implicita')
const ochoX = () => producto('p2', num('a2', 8), letra('x2', 'x'), 'implicita')

const FRAMES: Array<{ texto: string; frame: Frame }> = [
  {
    texto: 'El problema.',
    frame: { expr: igual('e', resta('r1', dosX(), num('b1', 1)), suma('s1', ochoX(), num('b2', 11))) },
  },
  {
    texto: 'El 8x viaja a la izquierda y el 1 a la derecha (las mismas claves se deslizan).',
    frame: { expr: igual('e', resta('r2', dosX(), ochoX()), suma('s2', num('b2', 11), num('b1', 1))), resaltar: ['p2', 'b1'] },
  },
  {
    texto: 'Se juntan: los tokens que ya no están salen y los nuevos entran con fade.',
    frame: { expr: igual('e', producto('p3', neg('n3', num('c3', 6)), letra('x1', 'x'), 'implicita'), num('d3', 12)) },
  },
  {
    texto: 'La x queda sola.',
    frame: { expr: igual('e', letra('x1', 'x'), neg('n4', num('d4', 2))), resaltar: ['n4'] },
  },
]

export function DemoFlip() {
  const [i, setI] = useState(0)
  return (
    <main className="hoja hoja-ancha">
      <h1 style={{ fontSize: 'var(--t3)', marginBottom: 'var(--cuadro)' }}>Prueba de animación (solo desarrollo)</h1>
      <p style={{ marginBottom: 'var(--cuadro)' }}>{FRAMES[i].texto}</p>
      <div style={{ minHeight: '5rem' }}>
        <ExpresionAnimada frame={FRAMES[i].frame} grande />
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: 'var(--cuadro)' }}>
        <button type="button" className="boton boton-chico" disabled={i === 0} onClick={() => setI(i - 1)}>
          Anterior
        </button>
        <button type="button" className="boton boton-chico" disabled={i === FRAMES.length - 1} onClick={() => setI(i + 1)}>
          Siguiente
        </button>
      </div>
    </main>
  )
}
