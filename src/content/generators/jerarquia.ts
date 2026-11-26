import { f } from '../../engine/fraction'
import { par } from '../../engine/latex'
import type { Plantillas } from './tipos'

const IZQ_A_DER = 'Primero se multiplica o divide, y después se suma o resta. No vayas de izquierda a derecha.'

export const jerarquia: Plantillas = {
  sumaProducto(r) {
    const a = r.nonZero(-9, 9)
    const b = r.int(2, 9)
    const c = r.nonZero(-9, 9)
    return {
      tipo: 'sumaProducto',
      enunciado: 'Resuelve.',
      latex: `${a} + ${b} \\cdot ${par(c)}`,
      respuesta: f(a + b * c),
      pista: 'Resuelve primero la multiplicación.',
      errores: [{ id: 'izquierda-a-derecha', valor: f((a + b) * c), mensaje: IZQ_A_DER }],
      datos: { a, b, c },
    }
  },

  restaProducto(r) {
    const a = r.int(-9, 15)
    const b = r.int(2, 9)
    const c = r.nonZero(-6, 9)
    return {
      tipo: 'restaProducto',
      enunciado: 'Resuelve.',
      latex: `${a} - ${b} \\cdot ${par(c)}`,
      respuesta: f(a - b * c),
      pista: 'Resuelve primero la multiplicación, y cuida el signo menos que está antes.',
      errores: [
        { id: 'izquierda-a-derecha', valor: f((a - b) * c), mensaje: IZQ_A_DER },
        {
          id: 'signo-tras-producto',
          valor: f(a + b * c),
          mensaje: `El menos que está antes del ${b} también afecta al resultado de la multiplicación.`,
        },
      ],
      datos: { a, b, c },
    }
  },

  parentesis(r) {
    const a = r.nonZero(-7, 9)
    const b = r.nonZero(-9, 9)
    const c = r.nonZero(-9, 9)
    return {
      tipo: 'parentesis',
      enunciado: 'Resuelve.',
      latex: `${a} \\cdot (${b}${c < 0 ? ` - ${-c}` : ` + ${c}`})`,
      respuesta: f(a * (b + c)),
      pista: 'Lo que está dentro del paréntesis va primero.',
      errores: [
        {
          id: 'ignoro-parentesis',
          valor: f(a * b + c),
          mensaje: 'Lo que está entre paréntesis se resuelve primero (o el número de afuera multiplica a los dos de adentro).',
        },
      ],
      datos: { a, b, c },
    }
  },

  sumaDivision(r) {
    const a = r.nonZero(-9, 12)
    const c = r.int(2, 6) * r.signo()
    const b = c * r.nonZero(-6, 6)
    return {
      tipo: 'sumaDivision',
      enunciado: 'Resuelve.',
      latex: `${a} + ${par(b)} \\div ${par(c)}`,
      respuesta: f(a + b / c),
      pista: 'Resuelve primero la división.',
      errores: [{ id: 'izquierda-a-derecha', valor: f(a + b, c), mensaje: IZQ_A_DER }],
      datos: { a, b, c },
    }
  },
}
