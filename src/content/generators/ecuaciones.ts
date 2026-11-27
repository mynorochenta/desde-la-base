import { f } from '../../engine/fraction'
import { intentar as si } from '../../engine/ejercicio'
import { mas, tx } from '../../engine/latex'
import type { Plantillas } from './tipos'

const ENUNCIADO = 'Encuentra el valor de x.'


/**
 * Explicación principal: una ecuación es una balanza, y se hace lo mismo en los
 * dos lados. "Pasa con el signo contrario" solo aparece como atajo.
 */
const TRANSPONER =
  'Para quitar un número de un lado, haz la operación contraria en los dos lados: si está sumando, réstalo en los dos lados (y al revés). Atajo: es como pasarlo al otro lado con el signo contrario.'

export const ecuacionesLineales: Plantillas = {
  unPaso(r) {
    const x = r.nonZero(-12, 12)
    const b = r.nonZero(-15, 15)
    const c = x + b
    return {
      tipo: 'unPaso',
      enunciado: ENUNCIADO,
      latex: `x${mas(b)} = ${c}`,
      respuesta: f(x),
      pista: `Para dejar la x sola, quita el ${b} de la izquierda haciendo la operación contraria en los dos lados.`,
      errores: [{ id: 'transponer', valor: f(c + b), mensaje: TRANSPONER }],
      datos: { a: 1, b, c },
    }
  },

  dosPasos(r) {
    const x = r.nonZero(-9, 9)
    const a = r.int(2, 9) * r.signo()
    const b = r.nonZero(-15, 15)
    const c = a * x + b
    return {
      tipo: 'dosPasos',
      enunciado: ENUNCIADO,
      latex: `${tx(a)}${mas(b)} = ${c}`,
      respuesta: f(x),
      pista: `Primero quita el ${b} haciendo la operación contraria en los dos lados. Después divide los dos lados entre ${a}.`,
      errores: [
        { id: 'transponer', valor: f(c + b, a), mensaje: TRANSPONER },
        {
          id: 'paso-multiplicando',
          valor: f((c - b) * a),
          mensaje: `El ${a} está multiplicando a la x. Para quitarlo, divide los dos lados entre ${a}; no multipliques.`,
        },
        {
          id: 'paso-restando',
          valor: f(c - b - a),
          mensaje: `El ${a} no está sumando: está multiplicando a la x. Por eso se quita dividiendo los dos lados entre ${a}.`,
        },
        {
          id: 'divide-invertido',
          valor: si(() => f(a, c - b)),
          mensaje: `Dividiste al revés. Si ${a}·x = ${c - b}, entonces x = ${c - b} ÷ ${a}.`,
        },
      ],
      datos: { a, b, c },
    }
  },

  resultadoFraccion(r) {
    const a = r.int(2, 9) * r.signo()
    let p = r.nonZero(-20, 20)
    while (p % a === 0) p = r.nonZero(-20, 20)
    const b = r.nonZero(-10, 10)
    const c = b + p
    return {
      tipo: 'resultadoFraccion',
      enunciado: `${ENUNCIADO} Puede salir una fracción.`,
      latex: `${tx(a)}${mas(b)} = ${c}`,
      respuesta: f(p, a),
      pedirSimplificada: true,
      pista: 'Despeja igual que siempre. Si la división no es exacta, deja el resultado como fracción.',
      errores: [
        { id: 'transponer', valor: f(c + b, a), mensaje: TRANSPONER },
        { id: 'paso-multiplicando', valor: f(p * a), mensaje: `El ${a} está multiplicando a la x. Para quitarlo, divide los dos lados entre ${a}.` },
        { id: 'divide-invertido', valor: f(a, p), mensaje: `Dividiste al revés. Si ${a}·x = ${p}, entonces x = ${p}/${a}.` },
      ],
      datos: { a, b, c },
    }
  },

  ambosLados(r) {
    const x = r.nonZero(-8, 8)
    const a = r.nonZero(-7, 9)
    let c = r.nonZero(-7, 9)
    while (c === a) c = r.nonZero(-7, 9)
    const b = r.int(-15, 15)
    const d = (a - c) * x + b
    return {
      tipo: 'ambosLados',
      enunciado: ENUNCIADO,
      latex: `${tx(a)}${b === 0 ? '' : mas(b)} = ${tx(c)}${d === 0 ? '' : mas(d)}`,
      respuesta: f(x),
      pista: 'Junta las x en un lado y los números en el otro. Para mover un término, haz la operación contraria en los dos lados. Atajo: es como pasarlo al otro lado con el signo contrario.',
      errores: [
        {
          id: 'x-sin-cambiar-signo',
          valor: si(() => f(d - b, a + c)),
          mensaje: `Para quitar ${tx(c)} de la derecha, réstalo en los dos lados. A la izquierda queda (${a} − ${c < 0 ? `(${c})` : c})x.`,
        },
        { id: 'transponer', valor: si(() => f(d + b, a - c)), mensaje: TRANSPONER },
      ],
      datos: { a, b, c, d },
    }
  },
}
