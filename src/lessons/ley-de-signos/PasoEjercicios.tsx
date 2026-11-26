import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { semillaNueva } from '../../engine/rng'
import { Palitos } from '../../ui/Palitos'
import { RectaNumerica } from '../../ui/RectaNumerica'
import { Responder, type Revision } from '../../ui/Responder'
import type { Ejercicio } from '../../engine/types'
import { saltosDe, tanda } from './ejercicios'
import { describir, rangoPara } from './saltos'

/** Después de revisar una suma o resta, se puede ver el recorrido en la recta. */
function VerEnRecta({ ejercicio, abierto: abiertoInicial }: { ejercicio: Ejercicio; abierto: boolean }) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  const m = saltosDe(ejercicio)
  if (!m) return null
  return (
    <div className="ver-recta">
      {abierto ? (
        <RectaNumerica modelo={m} rango={rangoPara(m)} repetir={0} descripcion={describir(m)} />
      ) : (
        <button type="button" className="boton-texto" onClick={() => setAbierto(true)}>
          Verlo en la recta
        </button>
      )}
    </div>
  )
}

/**
 * Una tanda de ejercicios generados. Se usa para la práctica y para la mini
 * prueba; al terminar avisa cuántos salieron bien.
 */
export function PasoEjercicios({
  titulo,
  texto,
  cantidad,
  textoFinal,
  alTerminar,
}: {
  titulo: string
  texto: string
  cantidad: number
  textoFinal: string
  alTerminar: (aciertos: number) => void
}) {
  const [semilla] = useState(semillaNueva)
  const ejercicios = useMemo(() => tanda(cantidad, semilla), [cantidad, semilla])
  const [i, setI] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const ej = ejercicios[i]

  const seguir = (r: Revision) => {
    const total = aciertos + (r.correcto ? 1 : 0)
    setAciertos(total)
    if (i + 1 >= ejercicios.length) {
      alTerminar(total)
      return
    }
    setI(i + 1)
    window.scrollTo(0, 0)
  }

  return (
    <section className="paso" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="paso-titulo">
        {titulo}
      </h1>
      <p className="paso-texto">{texto}</p>
      <p className="ejercicios-cuenta">
        {i > 0 && <Palitos cantidad={i} />}
        <span>
          Ejercicio {i + 1} de {ejercicios.length}
        </span>
      </p>
      <motion.div key={ej.semilla} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
        <Responder
          ejercicio={ej}
          alSeguir={seguir}
          textoSeguir={i + 1 >= ejercicios.length ? textoFinal : 'Siguiente'}
          extra={(r) => <VerEnRecta ejercicio={ej} abierto={!r.correcto} />}
        />
      </motion.div>
    </section>
  )
}
