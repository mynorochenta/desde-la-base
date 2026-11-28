import { Fraction } from '../../engine/fraction'
import type { Nodo } from '../../expr/ast'
import { frac, neg, num } from '../../expr/construir'

/** Fábrica de ids nuevos para los nodos que crea el motor ("a1", "a2"…). */
export class Ids {
  private n = 0
  nuevo(): string {
    return `a${++this.n}`
  }
}

/** Entero escrito tal cual: −3 es neg(3). */
export function nodoEntero(ids: Ids, v: number): Nodo {
  return v < 0 ? neg(ids.nuevo(), num(ids.nuevo(), -v)) : num(ids.nuevo(), v)
}

/**
 * Fracción "cruda": se escribe con estos números aunque se pueda simplificar
 * (9/12 sigue siendo 9/12). El signo va adelante.
 */
export function nodoCrudo(ids: Ids, numerador: number, denominador: number): Nodo {
  if (denominador === 1) return nodoEntero(ids, numerador)
  const negativo = numerador < 0 !== denominador < 0 && numerador !== 0
  const f = frac(ids.nuevo(), num(ids.nuevo(), Math.abs(numerador)), num(ids.nuevo(), Math.abs(denominador)))
  return negativo ? neg(ids.nuevo(), f) : f
}

/** Un valor exacto ya simplificado. */
export const nodoDe = (ids: Ids, v: Fraction) => nodoCrudo(ids, v.num, v.den)

/** Partes crudas de un número escrito: −9/12 → { num: −9, den: 12 }. */
export type Crudo = { num: number; den: number }

/**
 * Si el nodo es un número escrito (5, −5, 3/4, −3/4), devuelve sus partes
 * tal como están escritas. Si es una operación, devuelve null.
 */
export function crudo(n: Nodo): Crudo | null {
  switch (n.tipo) {
    case 'num':
      return { num: n.valor, den: 1 }
    case 'neg': {
      if (n.arg.tipo === 'neg') return null
      const c = crudo(n.arg)
      return c ? { num: -c.num, den: c.den } : null
    }
    case 'frac': {
      const a = entero(n.num)
      const b = entero(n.den)
      if (a === null || b === null || b === 0) return null
      return b < 0 ? { num: -a, den: -b } : { num: a, den: b }
    }
    default:
      return null
  }
}

/** 5 o −5 escritos como número (no como operación). */
function entero(n: Nodo): number | null {
  if (n.tipo === 'num') return n.valor
  if (n.tipo === 'neg' && n.arg.tipo === 'num') return -n.arg.valor
  return null
}

export const valorDe = (c: Crudo) => Fraction.of(c.num, c.den)
export const esLiteral = (n: Nodo) => crudo(n) !== null

/** Texto de un número para las explicaciones: −3, 3/4, −3/4. */
export function texto(v: Fraction | Crudo): string {
  const n = v.num
  const d = v.den
  const s = n < 0 ? '−' : ''
  return d === 1 ? `${s}${Math.abs(n)}` : `${s}${Math.abs(n)}/${d}`
}

/** Igual que texto, pero con paréntesis si es negativo: 2 · (−3). */
export const textoPar = (v: Fraction | Crudo) => (v.num < 0 ? `(${texto(v)})` : texto(v))

export function mcm(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  const p = x * y
  while (y) [x, y] = [y, x % y]
  return p / x
}
