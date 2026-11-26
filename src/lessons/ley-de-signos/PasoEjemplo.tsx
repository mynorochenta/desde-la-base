import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Formula } from '../../ui/Formula'
import { RectaNumerica } from '../../ui/RectaNumerica'
import { EJEMPLOS, type PasoGuiado } from './contenido'
import { describir, rangoPara } from './saltos'

/** Un paso del ejemplo: se responde eligiendo una opción. Si fallas, te explica y puedes volver a elegir. */
function Paso({ paso, activo, primero, alAcertar }: { paso: PasoGuiado; activo: boolean; primero: boolean; alAcertar: () => void }) {
  const [elegidas, setElegidas] = useState<number[]>([])
  const raiz = useRef<HTMLLIElement>(null)
  // Cuando aparece un paso nuevo, la pantalla baja hasta él.
  useEffect(() => {
    if (primero) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    raiz.current?.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' })
  }, [primero])
  const pregunta = paso.pregunta
  const acerto = pregunta ? elegidas.some((i) => pregunta.opciones[i].correcta) : true
  const ultima = elegidas.at(-1)

  return (
    <motion.li ref={raiz} className="guiado-paso" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="guiado-formula">
        <Formula latex={paso.latex} grande />
      </div>
      <p className="guiado-explicacion">{paso.explicacion}</p>
      {pregunta && (
        <fieldset className="guiado-pregunta" disabled={!activo && acerto}>
          <legend>{pregunta.texto}</legend>
          <div className="guiado-opciones">
            {pregunta.opciones.map((o, i) => {
              const elegida = elegidas.includes(i)
              return (
                <button
                  key={o.texto}
                  type="button"
                  className={`opcion${elegida ? (o.correcta ? ' opcion-bien' : ' opcion-mal') : ''}`}
                  aria-pressed={elegida}
                  disabled={acerto || elegida}
                  onClick={() => {
                    setElegidas((e) => [...e, i])
                    if (o.correcta) alAcertar()
                  }}
                >
                  {o.texto}
                </button>
              )
            })}
          </div>
          {ultima !== undefined && (
            <p className={pregunta.opciones[ultima].correcta ? 'guiado-retro guiado-bien' : 'guiado-retro guiado-mal'} role="status">
              {pregunta.opciones[ultima].retro}
            </p>
          )}
        </fieldset>
      )}
    </motion.li>
  )
}

export function PasoEjemplo({ alSeguir }: { alSeguir: () => void }) {
  const [ejemplo, setEjemplo] = useState(0)
  const [hechos, setHechos] = useState(0)
  const e = EJEMPLOS[ejemplo]
  const terminado = hechos >= e.pasos.length
  const ultimo = ejemplo === EJEMPLOS.length - 1

  return (
    <section className="paso" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="paso-titulo">
        Ejemplo guiado
      </h1>
      <p className="paso-texto">
        Ejemplo {ejemplo + 1} de {EJEMPLOS.length}: {e.titulo.toLowerCase()}. Resuélvelo paso a paso.
      </p>

      <ol className="guiado" key={ejemplo}>
        {e.pasos.slice(0, hechos + 1).map((p, i) => (
          <Paso key={i} paso={p} activo={i === hechos} primero={i === 0} alAcertar={() => setHechos((h) => Math.max(h, i + 1))} />
        ))}
      </ol>

      {terminado && (
        <motion.div className="guiado-cierre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="guiado-cierre-formula">
            <Formula latex={e.cierre} grande />
          </p>
          <RectaNumerica modelo={e.recta} rango={rangoPara(e.recta)} repetir={ejemplo} descripcion={describir(e.recta)} />
          <div className="paso-acciones">
            {ultimo ? (
              <button type="button" className="boton" onClick={alSeguir}>
                Ir a practicar
              </button>
            ) : (
              <button
                type="button"
                className="boton"
                onClick={() => {
                  setEjemplo(ejemplo + 1)
                  setHechos(0)
                  window.scrollTo(0, 0)
                }}
              >
                Siguiente ejemplo
              </button>
            )}
          </div>
        </motion.div>
      )}
    </section>
  )
}
