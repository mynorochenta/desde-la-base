import { mcd } from '../engine/fraction'
import type { Rng } from '../engine/rng'
import type { Nodo } from '../expr/ast'

/**
 * "Practicar uno igual": cambia los números de un problema y conserva su
 * forma. Se respetan los ceros, los unos y los exponentes (cambiarlos cambia
 * el tipo de problema), y el tamaño de cada número. Las letras se quedan.
 */

function entero(r: Rng, v: number): number {
  if (v === 0 || v === 1) return v
  if (v <= 9) return r.int(2, 9)
  if (v <= 12) return r.int(2, 12)
  if (v <= 99) return r.int(10, 99)
  return r.int(100, 999)
}

export function cambiarNumeros(n: Nodo, r: Rng): Nodo {
  switch (n.tipo) {
    case 'num':
      return { ...n, valor: entero(r, n.valor) }
    case 'var':
      return n
    case 'mixto': {
      const den = r.int(2, 9)
      let num = r.int(1, den - 1)
      while (mcd(num, den) !== 1) num = r.int(1, den - 1)
      return { ...n, entero: r.int(1, 5), num, den }
    }
    case 'pot':
      // El exponente se queda: 3² sigue siendo un cuadrado.
      return { ...n, base: cambiarNumeros(n.base, r) }
    case 'frac': {
      if (n.num.tipo === 'num' && n.den.tipo === 'num' && n.den.valor > 1) {
        const den = r.int(2, n.den.valor <= 9 ? 9 : 12)
        const propia = n.num.valor < n.den.valor
        let num = propia ? r.int(1, den - 1) : r.int(den + 1, den * 3)
        for (let k = 0; k < 10 && mcd(num, den) !== 1; k++) num = propia ? r.int(1, den - 1) : r.int(den + 1, den * 3)
        return { ...n, num: { ...n.num, valor: num }, den: { ...n.den, valor: den } }
      }
      return { ...n, num: cambiarNumeros(n.num, r), den: cambiarNumeros(n.den, r) }
    }
    case 'neg':
    case 'par':
      return { ...n, arg: cambiarNumeros(n.arg, r) }
    default:
      return { ...n, izq: cambiarNumeros(n.izq, r), der: cambiarNumeros(n.der, r) }
  }
}
