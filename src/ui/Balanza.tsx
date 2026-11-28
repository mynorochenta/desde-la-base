import { motion } from 'motion/react'
import type { Nodo } from '../expr/ast'
import { evaluar } from '../expr/evaluar'
import { textoDe } from '../expr/tokens'
import { ExpresionAnimada } from './ExpresionAnimada'
import { curva, dur } from './movimiento'
import './Balanza.css'

/** Cuánto se inclina el brazo cuando los dos lados no pesan lo mismo. */
const INCLINACION = 7

/**
 * Balanza de una ecuación: en cada platillo, lo que hay en ese lado. La
 * operación del paso ("− 8x") cae en los dos platillos a la vez, para que se
 * vea que se hace lo mismo en los dos lados. Si los lados no pueden ser
 * iguales (0 = 5), la balanza se inclina hacia el lado mayor.
 */
export function Balanza({
  izq,
  der,
  operacion,
  equilibrada,
}: {
  izq: Nodo
  der: Nodo
  operacion?: string
  equilibrada: boolean
}) {
  let angulo = 0
  if (!equilibrada) {
    const a = evaluar(izq)
    const b = evaluar(der)
    // Baja el lado que pesa más.
    angulo = a.ok && b.ok && a.valor.compare(b.valor) > 0 ? -INCLINACION : INCLINACION
  }
  const ti = textoDe(izq)
  const td = textoDe(der)
  const descripcion = equilibrada
    ? `Balanza en equilibrio: a la izquierda ${ti} y a la derecha ${td}.${operacion ? ` Se hace ${operacion} en los dos platillos, así que sigue en equilibrio.` : ''}`
    : `La balanza no puede quedar en equilibrio: a la izquierda ${ti} y a la derecha ${td}.`

  const carga = (n: Nodo) => (
    <div className="balanza-carga">
      {operacion && (
        <motion.span
          className="balanza-operacion"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.media, ease: curva.entrada, delay: dur.media }}
        >
          {operacion}
        </motion.span>
      )}
      <ExpresionAnimada frame={{ expr: n }} />
    </div>
  )

  return (
    <figure className="balanza">
      <div className="balanza-figura" aria-hidden="true">
        <motion.div
          className="balanza-brazo"
          initial={{ rotate: 0 }}
          animate={{ rotate: angulo }}
          transition={{ duration: dur.lenta, ease: curva.rebote, delay: dur.media }}
        >
          <div className="balanza-lado">
            {carga(izq)}
            <div className="balanza-platillo" />
          </div>
          <div className="balanza-lado">
            {carga(der)}
            <div className="balanza-platillo" />
          </div>
        </motion.div>
        <div className="balanza-pie" />
      </div>
      <figcaption className="sr-only">{descripcion}</figcaption>
    </figure>
  )
}
