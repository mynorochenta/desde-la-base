import { crearRng, type Rng } from '../../engine/rng'
import { mcd } from '../../engine/fraction'
import type { Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'
import { latexDe } from '../../expr/tokens'

/**
 * "Practicar uno igual": misma forma del problema, otros números.
 * Se respetan los ceros, los unos y los exponentes (cambiarlos cambia el tipo
 * de problema), y el tamaño de cada número. Se repite hasta que el
 * resultado sea sencillo.
 */

const INTENTOS = 60

function entero(r: Rng, v: number): number {
  if (v === 0 || v === 1) return v
  if (v <= 12) return r.int(2, 12)
  if (v <= 99) return r.int(10, 99)
  return r.int(100, 999)
}

function cambiar(n: Nodo, r: Rng): Nodo {
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
      return { ...n, base: cambiar(n.base, r) }
    case 'frac': {
      if (n.num.tipo === 'num' && n.den.tipo === 'num' && n.den.valor > 1) {
        const den = r.int(2, 12)
        const propia = n.num.valor < n.den.valor
        let num = propia ? r.int(1, den - 1) : r.int(den + 1, den * 3)
        for (let k = 0; k < 10 && mcd(num, den) !== 1; k++) num = propia ? r.int(1, den - 1) : r.int(den + 1, den * 3)
        return { ...n, num: { ...n.num, valor: num }, den: { ...n.den, valor: den } }
      }
      return { ...n, num: cambiar(n.num, r), den: cambiar(n.den, r) }
    }
    case 'neg':
    case 'par':
      return { ...n, arg: cambiar(n.arg, r) }
    default:
      return { ...n, izq: cambiar(n.izq, r), der: cambiar(n.der, r) }
  }
}

/** ¿Resultado sencillo? Sin división entre cero y con números chicos. */
function sencillo(n: Nodo): boolean {
  const v = evaluar(n)
  if (!v.ok) return false
  return Math.abs(v.valor.num) <= 999 && v.valor.den <= 144
}

export function parecidoAritmetica(original: Nodo, semilla: number, valido: (n: Nodo) => boolean = () => true): Nodo | null {
  const r = crearRng(semilla)
  const antes = latexDe(original)
  for (let k = 0; k < INTENTOS; k++) {
    const nuevo = cambiar(original, r)
    if (latexDe(nuevo) === antes) continue
    if (sencillo(nuevo) && valido(nuevo)) return nuevo
  }
  return null
}
