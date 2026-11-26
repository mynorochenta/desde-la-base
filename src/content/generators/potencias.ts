import { f } from '../../engine/fraction'
import type { Plantillas } from './tipos'

const SOLO_EXPONENTE = 'Escribe solo el exponente que va en el cuadrito.'

export const potencias: Plantillas = {
  potencia(r) {
    const a = r.int(2, 5)
    const n = r.int(2, a <= 3 ? 4 : 3)
    return {
      tipo: 'potencia',
      enunciado: 'Calcula.',
      latex: `${a}^{${n}}`,
      respuesta: f(a ** n),
      pista: `${a}^${n} es multiplicar el ${a} por sí mismo ${n} veces.`,
      errores: [
        {
          id: 'base-por-exponente',
          valor: f(a * n),
          mensaje: `${a}^${n} no es ${a} × ${n}. Es ${Array(n).fill(a).join(' × ')}.`,
        },
      ],
      datos: { a, n },
    }
  },

  baseNegativa(r) {
    const a = r.int(2, 5)
    const n = r.pick([2, 3] as const)
    const resp = (-a) ** n
    return {
      tipo: 'baseNegativa',
      enunciado: 'Calcula.',
      latex: `(-${a})^{${n}}`,
      respuesta: f(resp),
      pista: `(−${a})^${n} es multiplicar (−${a}) por sí mismo ${n} veces, con todo y signo.`,
      errores: [
        {
          id: 'signo-potencia',
          valor: f(-resp),
          mensaje:
            n % 2 === 0
              ? 'El signo está dentro del paréntesis, así que también se eleva: negativo por negativo da positivo.'
              : 'Un número negativo elevado a un exponente impar sigue siendo negativo.',
        },
        { id: 'base-por-exponente', valor: f(-a * n), mensaje: `(−${a})^${n} no es (−${a}) × ${n}: es multiplicarlo por sí mismo ${n} veces.` },
      ],
      datos: { a, n },
    }
  },

  menosSinParentesis(r) {
    const a = r.int(2, 9)
    return {
      tipo: 'menosSinParentesis',
      enunciado: 'Calcula. Fíjate bien: no hay paréntesis.',
      latex: `-${a}^{2}`,
      respuesta: f(-(a * a)),
      pista: `Sin paréntesis, el exponente solo afecta al ${a}. El menos se queda afuera.`,
      errores: [
        {
          id: 'menos-fuera',
          valor: f(a * a),
          mensaje: `Sin paréntesis, el exponente solo eleva al ${a}; el signo menos se queda afuera. Es −(${a}·${a}).`,
        },
      ],
      datos: { a },
    }
  },

  productoMismaBase(r) {
    const b = r.int(2, 9)
    const m = r.int(2, 7)
    const n = r.int(2, 7)
    return {
      tipo: 'productoMismaBase',
      enunciado: SOLO_EXPONENTE,
      latex: `${b}^{${m}} \\cdot ${b}^{${n}} = ${b}^{\\square}`,
      respuesta: f(m + n),
      pista: 'Al multiplicar potencias con la misma base, los exponentes se suman.',
      errores: [
        {
          id: 'multiplico-exponentes',
          valor: f(m * n),
          mensaje: `Al multiplicar con la misma base, los exponentes se suman: hay ${m} veces ${b} y luego ${n} veces ${b} más.`,
        },
      ],
      datos: { b, m, n },
    }
  },

  potenciaDePotencia(r) {
    const b = r.int(2, 9)
    const m = r.int(2, 5)
    const n = r.int(2, 4)
    return {
      tipo: 'potenciaDePotencia',
      enunciado: SOLO_EXPONENTE,
      latex: `\\left(${b}^{${m}}\\right)^{${n}} = ${b}^{\\square}`,
      respuesta: f(m * n),
      pista: 'Una potencia elevada a otra potencia: los exponentes se multiplican.',
      errores: [
        {
          id: 'sumo-exponentes',
          valor: f(m + n),
          mensaje: `Aquí los exponentes se multiplican: es ${b}^${m} repetido ${n} veces.`,
        },
      ],
      datos: { b, m, n },
    }
  },

  cocienteMismaBase(r) {
    const b = r.int(2, 9)
    const n = r.int(2, 5)
    const m = n + r.int(1, 6)
    return {
      tipo: 'cocienteMismaBase',
      enunciado: SOLO_EXPONENTE,
      latex: `\\frac{${b}^{${m}}}{${b}^{${n}}} = ${b}^{\\square}`,
      respuesta: f(m - n),
      pista: 'Al dividir potencias con la misma base, los exponentes se restan.',
      errores: [
        {
          id: 'divido-exponentes',
          valor: m % n === 0 ? f(m / n) : null,
          mensaje: 'Al dividir con la misma base, los exponentes se restan, no se dividen.',
        },
        { id: 'sumo-exponentes', valor: f(m + n), mensaje: 'Al dividir con la misma base, los exponentes se restan.' },
      ],
      datos: { b, m, n },
    }
  },

  exponenteCero(r) {
    const a = r.nonZero(-20, 20)
    return {
      tipo: 'exponenteCero',
      enunciado: 'Calcula.',
      latex: `${a < 0 ? `(${a})` : a}^{0}`,
      respuesta: f(1),
      pista: 'Todo número distinto de cero elevado a la 0 da 1.',
      errores: [
        { id: 'cero', valor: f(0), mensaje: 'Elevar a la 0 no da 0: todo número distinto de cero elevado a la 0 da 1.' },
        { id: 'base', valor: f(a), mensaje: 'Elevar a la 0 no deja el número igual: el resultado siempre es 1.' },
      ],
      datos: { a },
    }
  },
}
