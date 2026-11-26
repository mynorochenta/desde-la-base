import { useState } from 'react'
import { motion } from 'motion/react'
import { conceptos, type ConceptoId } from '../content/concepts'
import { cuentaComoCorrecto, preguntaDiagnostico } from '../diagnostic/preguntas'
import { MAX_PREGUNTAS, iniciar, responder, terminado, veredictos, type EstadoDiagnostico } from '../diagnostic/machine'
import type { Ejercicio } from '../engine/types'
import { href, ir, rutas } from '../router'
import { actualizarProgreso } from '../storage/progress'
import { Palitos } from '../ui/Palitos'
import { Responder, type Revision } from '../ui/Responder'
import './Diagnostico.css'

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

  const concepto = estado.actual as ConceptoId
  const numero = estado.historial.length + 1

  const siguiente = (revision: Revision) => {
    const nuevo = responder(estado, { tipo: ejercicio.tipo, semilla: ejercicio.semilla, correcto: revision.correcto })
    if (terminado(nuevo)) {
      guardarResultado(nuevo)
      ir(rutas.resultado)
      return
    }
    const mismoConcepto = nuevo.actual === estado.actual
    setEstado(nuevo)
    setEjercicio(preguntaDiagnostico(nuevo.actual!, mismoConcepto ? ejercicio.tipo : undefined))
    window.scrollTo(0, 0)
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
          aria-labelledby={`enunciado-${ejercicio.semilla}`}
        >
          <h1 className="sr-only">Diagnóstico, pregunta {numero}</h1>
          <p className="diag-tema">Tema: {conceptos[concepto].nombre}</p>
          <Responder
            ejercicio={ejercicio}
            alSeguir={siguiente}
            permitirNoSe
            contarComoCorrecto={(r) => cuentaComoCorrecto(concepto, r)}
          />
        </motion.section>
      )}
    </main>
  )
}
