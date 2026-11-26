import { f } from '../../engine/fraction'
import { par } from '../../engine/latex'
import type { Plantillas } from './tipos'

const msgProducto = (negativos: number) =>
  negativos === 2
    ? 'Negativo por negativo da positivo.'
    : 'Cuando un número es negativo y el otro positivo, el resultado es negativo.'

export const signos: Plantillas = {
  sumaDistinto(r) {
    const a = r.int(2, 15)
    let b = r.int(2, 15)
    if (b === a) b = a + r.int(1, 4)
    const primeroNegativo = r.bool()
    const x = primeroNegativo ? -a : a
    const y = primeroNegativo ? b : -b
    const resp = x + y
    return {
      tipo: 'sumaDistinto',
      enunciado: 'Resuelve.',
      latex: `${x} + ${par(y)}`,
      respuesta: f(resp),
      pista: 'Con signos distintos, resta las cantidades y deja el signo del número más grande.',
      errores: [
        {
          id: 'sumo-cantidades',
          valor: f(Math.sign(resp) * (a + b)),
          mensaje: 'Con signos distintos las cantidades no se suman: se restan. Piensa en deudas y pagos.',
        },
      ],
      datos: { x, y },
    }
  },

  restaNegativo(r) {
    const a = r.nonZero(-12, 12)
    const b = r.int(2, 12)
    return {
      tipo: 'restaNegativo',
      enunciado: 'Resuelve.',
      latex: `${a} - (-${b})`,
      respuesta: f(a + b),
      pista: 'Restar un número negativo es lo mismo que sumarlo.',
      errores: [
        {
          id: 'resta-negativo',
          valor: f(a - b),
          mensaje: `Restar un negativo es sumar: − (−${b}) se convierte en + ${b}.`,
        },
      ],
      datos: { a, b },
    }
  },

  producto(r) {
    const a = r.int(2, 9)
    const b = r.int(2, 9)
    const sa = r.signo()
    const sb: 1 | -1 = sa === 1 ? -1 : r.signo()
    const x = a * sa
    const y = b * sb
    const negativos = (sa < 0 ? 1 : 0) + (sb < 0 ? 1 : 0)
    return {
      tipo: 'producto',
      enunciado: 'Resuelve.',
      latex: `${par(x)} \\cdot ${par(y)}`,
      respuesta: f(x * y),
      pista: msgProducto(negativos),
      errores: [{ id: 'signo-producto', valor: f(-x * y), mensaje: `Revisa el signo. ${msgProducto(negativos)}` }],
      datos: { x, y },
    }
  },

  division(r) {
    const q = r.int(2, 9)
    const b = r.int(2, 9)
    const sq = r.signo()
    const sb: 1 | -1 = sq === 1 ? -1 : r.signo()
    const divisor = b * sb
    const cociente = q * sq
    const dividendo = cociente * divisor
    const negativos = (dividendo < 0 ? 1 : 0) + (divisor < 0 ? 1 : 0)
    return {
      tipo: 'division',
      enunciado: 'Resuelve.',
      latex: `${par(dividendo)} \\div ${par(divisor)}`,
      respuesta: f(cociente),
      pista: 'En la división los signos funcionan igual que en la multiplicación.',
      errores: [
        {
          id: 'signo-division',
          valor: f(-cociente),
          mensaje: `Revisa el signo. ${msgProducto(negativos).replace('por', 'entre')}`,
        },
      ],
      datos: { dividendo, divisor },
    }
  },
}
