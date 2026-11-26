import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { conceptos, type ConceptoId } from '../content/concepts'
import { cuentaComoCorrecto, preguntaDiagnostico } from '../diagnostic/preguntas'
import { MAX_PREGUNTAS, iniciar, responder, terminado, veredictos, type EstadoDiagnostico } from '../diagnostic/machine'
import { fr } from '../engine/latex'
import type { Ejercicio } from '../engine/types'
import { verificar, type Resultado } from '../engine/verify'
import { href, ir, rutas } from '../router'
import { actualizarProgreso } from '../storage/progress'
import { Formula } from '../ui/Formula'
import { Marca } from '../ui/Marca'
import { Palitos } from '../ui/Palitos'
import { ReportarError } from '../ui/ReportarError'
import { Teclado } from '../ui/Teclado'
import { aplicarTecla } from '../ui/teclado-logica'
import './Diagnostico.css'

type Revision = { resultado: Resultado | null; correcto: boolean; noSabe: boolean }

function guardarResultado(e: EstadoDiagnostico) {
  const v = veredictos(e)
  const fecha = Date.now()
  actualizarProgreso((p) => {
    const conceptosGuardados = { ...p.conceptos }
    for (const [id, ver] of Object.entries(v)) {
      // Lo aprendido en lecciones no se borra por un diagnóstico.
      if (conceptosGuardados[id]?.fuente === 'leccion' && conceptosGuardados[id].dominado) continue
      if (ver === 'sin-probar') continue
      conceptosGuardados[id] = { dominado: ver === 'dominado', fuente: 'diagnostico', fecha }
    }
    return { ...p, diagnostico: { fecha, veredictos: v, historial: e.historial }, conceptos: conceptosGuardados }
  })
}

function Intro({ alEmpezar }: { alEmpezar: () => void }) {
  return (
    <div className="diag-intro">
      <h1>Antes de empezar</h1>
      <p>Esto no es un examen y no tiene nota. Sirve para encontrar desde dónde te conviene empezar.</p>
      <p>
        Son {MAX_PREGUNTAS} preguntas como máximo. Si no sabes una, toca <strong>No sé</strong>: eso también nos ayuda.
      </p>
      <p>Puedes usar papel y lápiz.</p>
      <button type="button" className="boton" onClick={alEmpezar}>
        Empezar
      </button>
    </div>
  )
}

export function Diagnostico() {
  const [empezado, setEmpezado] = useState(false)
  const [estado, setEstado] = useState<EstadoDiagnostico>(() => iniciar())
  const [ejercicio, setEjercicio] = useState<Ejercicio>(() => preguntaDiagnostico(estado.actual!))
  const [entrada, setEntrada] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)
  const campo = useRef<HTMLInputElement>(null)

  const concepto = estado.actual as ConceptoId
  const numero = estado.historial.length + 1

  const revisar = () => {
    if (revision) return
    const r = verificar(ejercicio, entrada)
    if (r.estado === 'invalido') {
      setAviso(r.mensaje)
      return
    }
    setAviso(null)
    setRevision({ resultado: r, correcto: cuentaComoCorrecto(concepto, r), noSabe: false })
  }

  const noSe = () => {
    if (revision) return
    setAviso(null)
    setRevision({ resultado: null, correcto: false, noSabe: true })
  }

  const siguiente = () => {
    if (!revision) return
    const nuevo = responder(estado, { tipo: ejercicio.tipo, semilla: ejercicio.semilla, correcto: revision.correcto })
    if (terminado(nuevo)) {
      guardarResultado(nuevo)
      ir(rutas.resultado)
      return
    }
    const mismoConcepto = nuevo.actual === estado.actual
    setEstado(nuevo)
    setEjercicio(preguntaDiagnostico(nuevo.actual!, mismoConcepto ? ejercicio.tipo : undefined))
    setEntrada('')
    setRevision(null)
    window.scrollTo(0, 0)
  }

  const tocar = (t: string) => {
    if (revision) return
    setAviso(null)
    setEntrada((e) => aplicarTecla(e, t))
  }

  return (
    <main className="hoja diag">
      <div className="diag-barra">
        <a className="boton-texto diag-salir" href={href(rutas.inicio)}>
          Salir
        </a>
        {empezado && (
          <span className="diag-cuenta">
            <Palitos cantidad={estado.historial.length} />
            <span>Pregunta {numero}</span>
          </span>
        )}
      </div>

      {!empezado ? (
        <Intro alEmpezar={() => setEmpezado(true)} />
      ) : (
          <motion.section
            key={`${ejercicio.semilla}-${numero}`}
            className="diag-pregunta"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            aria-labelledby="diag-enunciado"
          >
            <p className="diag-tema">Tema: {conceptos[concepto].nombre}</p>
            <h1 id="diag-enunciado" className="diag-enunciado">
              {ejercicio.enunciado}
            </h1>
            <div className="diag-formula">
              <Formula latex={ejercicio.latex} grande />
            </div>

            <form
              className="diag-respuesta"
              onSubmit={(e) => {
                e.preventDefault()
                if (revision) siguiente()
                else revisar()
              }}
            >
              <label htmlFor="respuesta" className="sr-only">
                Tu respuesta
              </label>
              <span className="diag-igual" aria-hidden="true">
                =
              </span>
              <input
                ref={campo}
                id="respuesta"
                className="diag-campo"
                inputMode="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="tu respuesta"
                value={entrada}
                readOnly={!!revision}
                aria-invalid={!!aviso}
                aria-describedby={aviso ? 'diag-aviso' : undefined}
                onChange={(e) => {
                  setAviso(null)
                  setEntrada(e.target.value.slice(0, 14))
                }}
              />
            </form>
            {aviso && (
              <p id="diag-aviso" className="diag-aviso" role="alert">
                {aviso}
              </p>
            )}

            {revision ? (
              <Retro revision={revision} ejercicio={ejercicio} alSeguir={siguiente} />
            ) : (
              <>
                <Teclado alTocar={tocar} />
                <div className="diag-acciones">
                  <button type="button" className="boton" onClick={revisar}>
                    Revisar
                  </button>
                  <button type="button" className="boton boton-secundario" onClick={noSe}>
                    No sé
                  </button>
                </div>
              </>
            )}

            <ReportarError ejercicio={ejercicio} respuesta={entrada} />
          </motion.section>
      )}
    </main>
  )
}

function Retro({ revision, ejercicio, alSeguir }: { revision: Revision; ejercicio: Ejercicio; alSeguir: () => void }) {
  const { resultado, correcto, noSabe } = revision
  let mensaje: string
  if (noSabe) mensaje = 'Bien que lo digas. Así sabemos qué repasar.'
  else if (correcto) mensaje = resultado?.estado === 'casi' ? 'Correcto. Se puede simplificar, pero aquí cuenta.' : 'Correcto.'
  else mensaje = resultado!.mensaje

  return (
    <motion.div
      className={`diag-retro ${correcto ? 'diag-retro-bien' : 'diag-retro-mal'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
    >
      <div className="diag-retro-fila">
        {!noSabe && <Marca tipo={correcto ? 'bien' : 'mal'} />}
        <p>{mensaje}</p>
      </div>
      {!correcto && (
        <p className="diag-solucion">
          La respuesta es <Formula latex={fr(ejercicio.respuesta)} etiqueta={ejercicio.respuesta.toString()} />
        </p>
      )}
      <button type="button" className="boton" onClick={alSeguir} autoFocus>
        Siguiente
      </button>
    </motion.div>
  )
}
