import { useState } from 'react'
import { par } from '../../engine/latex'
import { Contador } from '../../ui/Contador'
import { Formula } from '../../ui/Formula'
import { RectaNumerica } from '../../ui/RectaNumerica'
import { RANGO_PRODUCTO, RANGO_SUMA, REGLAS_SUMA, TABLA_SIGNOS } from './contenido'
import { casoProducto, casoSuma, producto, resta, suma, type CasoProducto, type CasoSuma } from './saltos'

const menos = (n: number) => (n < 0 ? `−${-n}` : `${n}`)

/** Lista de casos que se van marcando a medida que la persona los prueba. */
function Casos<C extends string>({ casos, probados }: { casos: Array<{ id: C; texto: string }>; probados: Set<C> }) {
  return (
    <ul className="casos" aria-label="Casos que ya probaste">
      {casos.map((c) => (
        <li key={c.id} className={probados.has(c.id) ? 'caso caso-hecho' : 'caso'}>
          <span className="caso-casilla" aria-hidden="true">
            {probados.has(c.id) ? '✓' : ''}
          </span>
          {c.texto}
          <span className="sr-only">{probados.has(c.id) ? ': ya lo probaste' : ': falta'}</span>
        </li>
      ))}
    </ul>
  )
}

function useCasos<C extends string>() {
  const [probados, setProbados] = useState<Set<C>>(() => new Set())
  const marcar = (c: C) => setProbados((p) => (p.has(c) ? p : new Set(p).add(c)))
  return [probados, marcar] as const
}

export function PasoSuma({ alSeguir }: { alSeguir: () => void }) {
  const [a, setA] = useState(-3)
  const [op, setOp] = useState<'sumar' | 'restar'>('sumar')
  const [b, setB] = useState(5)
  const [repetir, setRepetir] = useState(0)
  const [listo, setListo] = useState(false)
  const [probados, marcar] = useCasos<CasoSuma>()

  const caso = casoSuma(op, b)
  const c = op === 'sumar' ? a + b : a - b
  const signo = op === 'sumar' ? '+' : '-'
  const cambiar = (f: () => void) => {
    f()
    setListo(false)
    setRepetir((r) => r + 1)
  }

  const descripcion = `Empiezas en ${menos(a)}. ${op === 'sumar' ? 'Sumas' : 'Restas'} ${menos(b)} y llegas a ${menos(c)}.`

  return (
    <section className="paso" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="paso-titulo">
        Sumar y restar es moverse
      </h1>
      <p className="paso-texto">Arrastra el punto azul para elegir dónde empiezas. Después elige qué sumar o restar.</p>

      <div className="explorador">
        <div className="explorador-formula" aria-live="polite">
          <Formula latex={`${a} ${signo} ${par(b)} = ${listo ? c : '\\;?'}`} grande etiqueta={listo ? descripcion : undefined} />
        </div>
        <RectaNumerica
          modelo={op === 'sumar' ? suma(a, b) : resta(a, b)}
          rango={[...RANGO_SUMA.recta]}
          limitesInicio={RANGO_SUMA.inicio}
          repetir={repetir}
          descripcion={descripcion}
          alMoverInicio={(n) => {
            setA(n)
            setListo(true)
          }}
          alTerminar={() => {
            setListo(true)
            marcar(caso)
          }}
        />

        <div className="explorador-controles">
          <div className="segmento" role="group" aria-label="Operación">
            {(['sumar', 'restar'] as const).map((o) => (
              <button key={o} type="button" aria-pressed={op === o} onClick={() => o !== op && cambiar(() => setOp(o))}>
                {o === 'sumar' ? 'Sumar' : 'Restar'}
              </button>
            ))}
          </div>
          <Contador etiqueta="Número" valor={b} min={RANGO_SUMA.numero[0]} max={RANGO_SUMA.numero[1]} alCambiar={(n) => cambiar(() => setB(n))} />
        </div>

        <div className="explorador-regla" aria-live="polite">
          {listo && (
            <>
              <p>{REGLAS_SUMA[caso].regla}</p>
              {op === 'restar' && (
                <p className="explorador-equivale">
                  <Formula latex={`${a} - ${par(b)} \\;=\\; ${a} + ${par(-b)}`} />
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="paso-texto">Prueba los cuatro casos:</p>
      <Casos
        casos={(Object.keys(REGLAS_SUMA) as CasoSuma[]).map((id) => ({ id, texto: REGLAS_SUMA[id].corto }))}
        probados={probados}
      />

      <div className="paso-acciones">
        <button type="button" className="boton" onClick={alSeguir}>
          Continuar
        </button>
      </div>
    </section>
  )
}

export function PasoProducto({ alSeguir }: { alSeguir: () => void }) {
  const [a, setA] = useState(-3)
  const [b, setB] = useState(2)
  const [repetir, setRepetir] = useState(0)
  const [listo, setListo] = useState(false)
  const [probados, marcar] = useCasos<CasoProducto>()

  const caso = casoProducto(a, b)
  const c = a * b
  const cambiar = (f: () => void) => {
    f()
    setListo(false)
    setRepetir((r) => r + 1)
  }
  const veces = Math.abs(b)
  const explicacion =
    b > 0
      ? `Son ${veces} ${veces === 1 ? 'salto' : 'saltos'} de ${menos(a)}, desde el cero.`
      : `Son ${veces} ${veces === 1 ? 'salto' : 'saltos'} de ${menos(a)}, pero las veces son negativas: los saltos se voltean.`

  return (
    <section className="paso" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="paso-titulo">
        Multiplicar es repetir saltos
      </h1>
      <p className="paso-texto">
        <Formula latex="(-3) \cdot 2" /> son dos saltos de −3. Si el número de veces es negativo, los saltos se voltean.
      </p>

      <div className="explorador">
        <div className="explorador-formula" aria-live="polite">
          <Formula latex={`${par(a)} \\cdot ${par(b)} = ${listo ? c : '\\;?'}`} grande />
        </div>
        <RectaNumerica
          modelo={producto(a, b)}
          rango={[...RANGO_PRODUCTO.recta]}
          repetir={repetir}
          descripcion={`${explicacion} Llegas a ${menos(c)}.`}
          alTerminar={() => {
            setListo(true)
            marcar(caso)
          }}
        />
        <div className="explorador-controles">
          <Contador etiqueta="Tamaño del salto" valor={a} min={RANGO_PRODUCTO.salto[0]} max={RANGO_PRODUCTO.salto[1]} alCambiar={(n) => cambiar(() => setA(n))} />
          <Contador etiqueta="Veces" valor={b} min={RANGO_PRODUCTO.veces[0]} max={RANGO_PRODUCTO.veces[1]} alCambiar={(n) => cambiar(() => setB(n))} />
        </div>
        <div className="explorador-regla" aria-live="polite">
          {listo && <p>{explicacion}</p>}
        </div>
      </div>

      <h2 className="paso-subtitulo">La regla de los signos</h2>
      <table className="tabla-signos">
        <caption className="sr-only">Signo del resultado al multiplicar o dividir</caption>
        <tbody>
          {TABLA_SIGNOS.map((f) => (
            <tr key={f.caso} className={listo && f.caso === caso ? 'tabla-activa' : undefined}>
              <th scope="row">{f.texto}</th>
              <td>
                da <strong>{f.resultado === '+' ? 'positivo' : 'negativo'}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="paso-texto">
        Signos iguales dan positivo. Signos distintos dan negativo. Al dividir pasa lo mismo:{' '}
        <Formula latex="(-12) \div (-3) = 4" />.
      </p>

      <Casos casos={TABLA_SIGNOS.map((f) => ({ id: f.caso, texto: `${f.texto[0].toUpperCase()}${f.texto.slice(1)}` }))} probados={probados} />

      <div className="paso-acciones">
        <button type="button" className="boton" onClick={alSeguir}>
          Continuar
        </button>
      </div>
    </section>
  )
}
