import { f, mcd } from '../../engine/fraction'
import { intentar as si } from '../../engine/ejercicio'
import { crudo, fr, frPar } from '../../engine/latex'
import type { Rng } from '../../engine/rng'
import type { Plantillas } from './tipos'

/** Fracción propia ya simplificada, como 3/4. */
function fraccionSimple(r: Rng, denMax = 9): { n: number; d: number } {
  const d = r.int(2, denMax)
  let n = r.int(1, d - 1)
  while (mcd(n, d) !== 1) n = r.int(1, d - 1)
  return { n, d }
}


export const fraccionesSimplificar: Plantillas = {
  simplificar(r) {
    const { n, d } = fraccionSimple(r)
    const k = r.int(2, 6)
    const s = r.bool(0.25) ? -1 : 1
    const num = s * n * k
    const den = d * k
    return {
      tipo: 'simplificar',
      enunciado: 'Simplifica la fracción lo más que puedas.',
      latex: crudo(num, den),
      respuesta: f(num, den),
      pedirSimplificada: true,
      pista: `Busca un número que divida exacto al ${Math.abs(num)} y al ${den}, y divide los dos.`,
      errores: [],
      datos: { num, den, k },
    }
  },
}

export const fraccionesSuma: Plantillas = {
  mismoDenominador(r) {
    const d = r.int(3, 12)
    const a = r.int(1, d - 1)
    const c = r.int(1, d - 1)
    const resta = r.bool(0.4)
    const resp = resta ? f(a - c, d) : f(a + c, d)
    return {
      tipo: 'mismoDenominador',
      enunciado: 'Resuelve y simplifica.',
      latex: `${crudo(a, d)} ${resta ? '-' : '+'} ${crudo(c, d)}`,
      respuesta: resp,
      pedirSimplificada: true,
      pista: 'Si el número de abajo es el mismo, se queda igual. Solo operas los de arriba.',
      errores: [
        {
          id: 'opero-denominadores',
          valor: resta ? null : f(a + c, 2 * d),
          mensaje: 'Cuando el número de abajo es el mismo, no se suma: se queda igual. Solo sumas los de arriba.',
        },
      ],
      datos: { a, c, d, resta: resta ? 1 : 0 },
    }
  },

  distintoDenominador(r) {
    const x = fraccionSimple(r, 8)
    let y = fraccionSimple(r, 8)
    while (y.d === x.d) y = fraccionSimple(r, 8)
    const resta = r.bool(0.4)
    const A = f(x.n, x.d)
    const B = f(y.n, y.d)
    const op = resta ? '-' : '+'
    return {
      tipo: 'distintoDenominador',
      enunciado: 'Resuelve y simplifica.',
      latex: `${fr(A)} ${op} ${fr(B)}`,
      respuesta: resta ? A.sub(B) : A.add(B),
      pedirSimplificada: true,
      pista: `Primero pasa las dos fracciones al mismo denominador, por ejemplo ${x.d * y.d}.`,
      errores: [
        {
          id: 'suma-denominadores',
          valor: si(() => (resta ? f(x.n - y.n, x.d - y.d) : f(x.n + y.n, x.d + y.d))),
          mensaje: `Los de abajo no se ${resta ? 'restan' : 'suman'}. Primero busca un denominador común: ${x.d} y ${y.d} caben los dos en ${x.d * y.d}.`,
        },
        {
          id: 'solo-denominador',
          valor: si(() => f(resta ? x.n - y.n : x.n + y.n, x.d * y.d)),
          mensaje: 'Cambiaste el de abajo, pero falta ajustar los de arriba: cada numerador se multiplica por el denominador de la otra fracción.',
        },
      ],
      datos: { a: x.n, b: x.d, c: y.n, d: y.d, resta: resta ? 1 : 0 },
    }
  },

  enteroMasFraccion(r) {
    const n = r.int(1, 5)
    const { n: a, d: b } = fraccionSimple(r)
    return {
      tipo: 'enteroMasFraccion',
      enunciado: 'Resuelve. Puedes responder como fracción.',
      latex: `${n} + ${crudo(a, b)}`,
      respuesta: f(n * b + a, b),
      pedirSimplificada: true,
      pista: `Escribe el ${n} como fracción con el mismo de abajo: ${n} = ${n * b}/${b}.`,
      errores: [
        {
          id: 'entero-arriba',
          valor: f(n + a, b),
          mensaje: `El ${n} es un entero, no ${n} pedazos. Conviértelo primero: ${n} = ${n * b}/${b}.`,
        },
      ],
      datos: { n, a, b },
    }
  },
}

export const fraccionesMultiplicacion: Plantillas = {
  multiplicar(r) {
    const x = fraccionSimple(r)
    const y = fraccionSimple(r)
    const s = r.bool(0.3) ? -1 : 1
    const A = f(s * x.n, x.d)
    const B = f(y.n, y.d)
    return {
      tipo: 'multiplicar',
      enunciado: 'Multiplica y simplifica.',
      latex: `${frPar(A)} \\cdot ${fr(B)}`,
      respuesta: A.mul(B),
      pedirSimplificada: true,
      pista: 'Multiplica derecho: arriba por arriba y abajo por abajo.',
      errores: [
        {
          id: 'cruzado',
          valor: A.div(B),
          mensaje: 'Multiplicaste en cruz; eso se hace para dividir. Para multiplicar: arriba por arriba y abajo por abajo.',
        },
        {
          id: 'denominador-comun',
          valor: si(() => f(s * x.n * y.n, x.d)),
          mensaje: 'Para multiplicar no hace falta denominador común: los de abajo también se multiplican.',
        },
      ],
      datos: { a: s * x.n, b: x.d, c: y.n, d: y.d },
    }
  },

  dividir(r) {
    const x = fraccionSimple(r)
    let y = fraccionSimple(r)
    while (y.n === x.n && y.d === x.d) y = fraccionSimple(r)
    const A = f(x.n, x.d)
    const B = f(y.n, y.d)
    return {
      tipo: 'dividir',
      enunciado: 'Divide y simplifica.',
      latex: `${fr(A)} \\div ${fr(B)}`,
      respuesta: A.div(B),
      pedirSimplificada: true,
      pista: 'Para dividir, voltea la segunda fracción y multiplica.',
      errores: [
        {
          id: 'no-volteo',
          valor: A.mul(B),
          mensaje: 'Multiplicaste directo. Para dividir hay que voltear la segunda fracción y después multiplicar.',
        },
        {
          id: 'volteo-primera',
          valor: A.inv().mul(B),
          mensaje: 'Volteaste la fracción equivocada: se voltea la segunda, la que está dividiendo.',
        },
      ],
      datos: { a: x.n, b: x.d, c: y.n, d: y.d },
    }
  },

  enteroPorFraccion(r) {
    const n = r.int(2, 9)
    const { n: a, d: b } = fraccionSimple(r)
    return {
      tipo: 'enteroPorFraccion',
      enunciado: 'Multiplica y simplifica.',
      latex: `${n} \\cdot ${crudo(a, b)}`,
      respuesta: f(n * a, b),
      pedirSimplificada: true,
      pista: `El ${n} es lo mismo que ${n}/1. Multiplica arriba por arriba y abajo por abajo.`,
      errores: [
        {
          id: 'multiplico-ambos',
          valor: f(n * a, n * b),
          mensaje: `El ${n} solo multiplica al de arriba, porque ${n} = ${n}/1.`,
        },
      ],
      datos: { n, a, b },
    }
  },
}
