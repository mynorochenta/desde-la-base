import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { conceptos, type ConceptoId } from '../content/concepts'
import { generar } from '../content/generators'
import { minis } from '../content/mini'
import { semillaNueva } from '../engine/rng'
import { leerProblema } from '../expr/parse'
import { href, ir, rutas } from '../router'
import { ExpresionAnimada } from '../ui/ExpresionAnimada'
import { curva, dur } from '../ui/movimiento'
import { Responder } from '../ui/Responder'
import './HojaTema.css'

const EJERCICIOS = 3

function Practica({ concepto }: { concepto: ConceptoId }) {
  const [ronda, setRonda] = useState(() => ({ semilla: semillaNueva(), hechos: 0, bien: 0 }))
  if (ronda.hechos >= EJERCICIOS) {
    return (
      <div className="hoja-tema-listo">
        <p>
          Te salieron {ronda.bien} de {EJERCICIOS}.
          {ronda.bien === EJERCICIOS ? ' ¡Muy bien!' : ' Si quieres, prueba con otros.'}
        </p>
        <button type="button" className="boton-texto" onClick={() => setRonda({ semilla: semillaNueva(), hechos: 0, bien: 0 })}>
          Probar otros {EJERCICIOS}
        </button>
      </div>
    )
  }
  const ejercicio = generar(concepto, ronda.semilla + ronda.hechos)
  return (
    <div>
      <p className="hoja-tema-cuenta">
        Ejercicio {ronda.hechos + 1} de {EJERCICIOS}
      </p>
      <Responder
        key={ronda.semilla + ronda.hechos}
        ejercicio={ejercicio}
        alSeguir={(r) => setRonda((x) => ({ ...x, hechos: x.hechos + 1, bien: x.bien + (r.correcto ? 1 : 0) }))}
      />
    </div>
  )
}

/**
 * La mini lección del árbol del porqué, en una hoja que sube desde abajo.
 * La pila de temas va en la ruta (&tema=signos,enteros): el botón "atrás"
 * del teléfono vuelve al tema anterior o cierra la hoja.
 */
export function HojaTema({ problema, temas }: { problema: string; temas: ConceptoId[] }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const actual = temas.at(-1)!
  const mini = minis[actual]!
  const concepto = conceptos[actual]
  const cerrar = () => ir(rutas.resolver(problema), { arriba: false })

  useEffect(() => {
    titulo.current?.focus()
  }, [actual])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ir(rutas.resolver(problema), { arriba: false })
    }
    document.addEventListener('keydown', tecla)
    document.body.classList.add('con-hoja')
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.classList.remove('con-hoja')
    }
  }, [problema])

  const abajo = concepto.prerrequisitos.filter((p) => minis[p] && !temas.includes(p))

  return (
    <div className="hoja-tema-fondo" onClick={cerrar}>
      <motion.div
        className="hoja-tema"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-tema-t"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: dur.media, ease: curva.entrada }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hoja-tema-barra">
          <nav aria-label="Temas abiertos" className="hoja-tema-migas">
            <ol>
              {temas.map((t, i) => (
                <li key={t}>
                  {i < temas.length - 1 ? (
                    <a href={href(rutas.resolver(problema, temas.slice(0, i + 1)))}>{conceptos[t].corto}</a>
                  ) : (
                    <span aria-current="page">{conceptos[t].corto}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <button type="button" className="hoja-tema-cerrar" onClick={cerrar} aria-label="Cerrar y volver al problema">
            ✕
          </button>
        </div>

        <h2 id="hoja-tema-t" className="hoja-tema-titulo" ref={titulo} tabIndex={-1}>
          {concepto.nombre}
        </h2>
        <p className="hoja-tema-regla">{mini.regla}</p>

        <h3 className="hoja-tema-sub">{mini.ejemplos.length === 1 ? 'Un ejemplo' : 'Ejemplos'}</h3>
        <ul className="hoja-tema-ejemplos">
          {mini.ejemplos.map((e) => {
            const l = leerProblema(e.problema)
            return (
              <li key={e.problema}>
                {l.ok && <ExpresionAnimada frame={{ expr: l.ast }} />}
                <p>{e.explicacion}</p>
              </li>
            )
          })}
        </ul>
        {mini.cuidado && (
          <p className="hoja-tema-cuidado">
            <strong>Cuidado:</strong> {mini.cuidado}
          </p>
        )}

        <h3 className="hoja-tema-sub">Pruébalo</h3>
        <Practica key={actual} concepto={actual} />

        {abajo.length > 0 && (
          <div className="hoja-tema-abajo">
            <p>¿Te cuesta? Baja a lo que va antes:</p>
            <ul>
              {abajo.map((p) => (
                <li key={p}>
                  <a className="pasos-tema" href={href(rutas.resolver(problema, [...temas, p]))}>
                    {conceptos[p].nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="hoja-tema-salidas">
          <button type="button" className="boton boton-chico" onClick={cerrar}>
            Volver al problema
          </button>
          {concepto.leccion && (
            <a className="boton-texto" href={href(rutas.leccion(concepto.leccion))}>
              Abrir la lección completa en Aprender
            </a>
          )}
        </div>
      </motion.div>
    </div>
  )
}
