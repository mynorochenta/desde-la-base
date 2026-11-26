import { f } from '../../engine/fraction'
import type { Plantillas } from './tipos'

export const enteros: Plantillas = {
  recta(r) {
    const a = r.int(-8, 8)
    const b = r.int(2, 7)
    const avanza = r.bool()
    const resp = avanza ? a + b : a - b
    return {
      tipo: 'recta',
      enunciado: `Empiezas en ${a} y ${avanza ? 'avanzas' : 'retrocedes'} ${b} pasos en la recta. ¿Dónde quedas?`,
      latex: `${a} ${avanza ? '+' : '-'} ${b}`,
      respuesta: f(resp),
      pista: 'Avanzar es ir a la derecha (sumar). Retroceder es ir a la izquierda (restar).',
      errores: [
        {
          id: 'direccion',
          valor: f(avanza ? a - b : a + b),
          mensaje: `Te moviste para el lado contrario. ${avanza ? 'Avanzar es ir a la derecha.' : 'Retroceder es ir a la izquierda.'}`,
        },
      ],
      datos: { a, b, avanza: avanza ? 1 : 0 },
    }
  },

  negativosJuntos(r) {
    const a = r.int(2, 12)
    const b = r.int(2, 12)
    return {
      tipo: 'negativosJuntos',
      enunciado: 'Resuelve.',
      latex: `-${a} + (-${b})`,
      respuesta: f(-(a + b)),
      pista: `Si debes ${a} y luego debes ${b} más, ¿cuánto debes en total?`,
      errores: [
        {
          id: 'negativos-dan-positivo',
          valor: f(a + b),
          mensaje: 'Dos negativos que se suman dan algo más negativo: suma las cantidades y deja el signo menos.',
        },
        {
          id: 'restar-cantidades',
          valor: f(-Math.abs(a - b)),
          mensaje: 'Cuando los dos son negativos no se restan: se juntan. Suma las cantidades.',
        },
      ],
      datos: { a, b },
    }
  },
}
