import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { fr } from '../engine/latex'
import type { Ejercicio } from '../engine/types'
import { verificar, type Resultado } from '../engine/verify'
import { Formula } from './Formula'
import { Marca } from './Marca'
import { ReportarError } from './ReportarError'
import { Teclado } from './Teclado'
import { aplicarTecla } from './teclado-logica'
import './Responder.css'

export type Revision = { resultado: Resultado | null; correcto: boolean; noSabe: boolean }

/**
 * Un ejercicio con su teclado, la revisión y la retroalimentación.
 * Se usa en el diagnóstico, la práctica y la mini prueba. Para pasar al
 * siguiente ejercicio, cambia la `key` del componente.
 */
export function Responder({
  ejercicio,
  alSeguir,
  contarComoCorrecto = (r) => r.estado === 'correcto' || r.estado === 'casi',
  permitirNoSe = false,
  textoSeguir = 'Siguiente',
  extra,
}: {
  ejercicio: Ejercicio
  alSeguir: (r: Revision) => void
  contarComoCorrecto?: (r: Resultado) => boolean
  permitirNoSe?: boolean
  textoSeguir?: string
  /** Algo más que mostrar después de revisar, como la recta numérica. */
  extra?: (r: Revision) => ReactNode
}) {
  const [entrada, setEntrada] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)

  const revisar = () => {
    if (revision) return
    const r = verificar(ejercicio, entrada)
    if (r.estado === 'invalido') {
      setAviso(r.mensaje)
      return
    }
    setAviso(null)
    setRevision({ resultado: r, correcto: contarComoCorrecto(r), noSabe: false })
  }

  const noSe = () => {
    if (revision) return
    setAviso(null)
    setRevision({ resultado: null, correcto: false, noSabe: true })
  }

  const seguir = () => {
    if (revision) alSeguir(revision)
  }

  const tocar = (t: string) => {
    if (revision) return
    setAviso(null)
    setEntrada((e) => aplicarTecla(e, t))
  }

  return (
    <div className="resp">
      <h2 id={`enunciado-${ejercicio.semilla}`} className="resp-enunciado">
        {ejercicio.enunciado}
      </h2>
      <div className="resp-formula">
        <Formula latex={ejercicio.latex} grande />
      </div>

      <form
        className="resp-linea"
        onSubmit={(e) => {
          e.preventDefault()
          if (revision) seguir()
          else revisar()
        }}
      >
        <label htmlFor={`respuesta-${ejercicio.semilla}`} className="sr-only">
          Tu respuesta
        </label>
        <span className="resp-igual" aria-hidden="true">
          =
        </span>
        <input
          id={`respuesta-${ejercicio.semilla}`}
          className="resp-campo"
          inputMode="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="tu respuesta"
          value={entrada}
          readOnly={!!revision}
          aria-invalid={!!aviso}
          aria-describedby={aviso ? `aviso-${ejercicio.semilla}` : undefined}
          onChange={(e) => {
            setAviso(null)
            setEntrada(e.target.value.slice(0, 14))
          }}
        />
      </form>
      {aviso && (
        <p id={`aviso-${ejercicio.semilla}`} className="resp-aviso" role="alert">
          {aviso}
        </p>
      )}

      {revision ? (
        <Retro revision={revision} ejercicio={ejercicio} alSeguir={seguir} textoSeguir={textoSeguir} extra={extra?.(revision)} />
      ) : (
        <>
          <Teclado alTocar={tocar} />
          <div className="resp-acciones">
            <button type="button" className="boton" onClick={revisar}>
              Revisar
            </button>
            {permitirNoSe && (
              <button type="button" className="boton boton-secundario" onClick={noSe}>
                No sé
              </button>
            )}
          </div>
        </>
      )}

      <ReportarError ejercicio={ejercicio} respuesta={entrada} />
    </div>
  )
}

function Retro({
  revision,
  ejercicio,
  alSeguir,
  textoSeguir,
  extra,
}: {
  revision: Revision
  ejercicio: Ejercicio
  alSeguir: () => void
  textoSeguir: string
  extra: ReactNode
}) {
  const { resultado, correcto, noSabe } = revision
  let mensaje: string
  if (noSabe) mensaje = 'Bien que lo digas. Así sabemos qué repasar.'
  else if (correcto) mensaje = resultado?.estado === 'casi' ? 'Correcto. Se puede simplificar, pero aquí cuenta.' : 'Correcto.'
  else mensaje = resultado!.mensaje

  return (
    <motion.div
      className={`resp-retro ${correcto ? 'resp-retro-bien' : 'resp-retro-mal'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
    >
      <div className="resp-retro-fila">
        {!noSabe && <Marca tipo={correcto ? 'bien' : 'mal'} />}
        <p>{mensaje}</p>
      </div>
      {!correcto && (
        <p className="resp-solucion">
          La respuesta es <Formula latex={fr(ejercicio.respuesta)} etiqueta={ejercicio.respuesta.toString()} />
        </p>
      )}
      {extra}
      <button type="button" className="boton" onClick={alSeguir} autoFocus>
        {textoSeguir}
      </button>
    </motion.div>
  )
}
