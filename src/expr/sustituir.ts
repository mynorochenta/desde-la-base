import type { Fraction } from '../engine/fraction'
import type { Nodo } from './ast'
import { frac, neg, num } from './construir'

/** El problema con la letra reemplazada por un número, para mostrar la comprobación. */
export function sustituir(n: Nodo, letra: string, v: Fraction): Nodo {
  let k = 0
  const valor = (): Nodo => {
    const id = `s${k++}`
    const a = Math.abs(v.num)
    const base: Nodo = v.den === 1 ? num(`${id}n`, a) : frac(`${id}f`, num(`${id}n`, a), num(`${id}d`, v.den))
    // Entre paréntesis si es negativo o fracción: 3(−2), no 3−2.
    const conSigno: Nodo = v.num < 0 ? neg(`${id}s`, base) : base
    return v.num < 0 || v.den !== 1 ? { tipo: 'par', id, arg: conSigno } : conSigno
  }
  const rec = (m: Nodo): Nodo => {
    switch (m.tipo) {
      case 'var':
        return m.nombre === letra ? valor() : m
      case 'num':
      case 'mixto':
        return m
      case 'neg':
      case 'par':
        return { ...m, arg: rec(m.arg) }
      case 'frac':
        return { ...m, num: rec(m.num), den: rec(m.den) }
      case 'pot':
        return { ...m, base: rec(m.base), exp: rec(m.exp) }
      case 'producto': {
        const izq = rec(m.izq)
        const der = rec(m.der)
        // 3x con x = 2 se escribe 3 · 2, no 32.
        return { ...m, izq, der, forma: m.forma === 'implicita' && m.der.tipo === 'var' ? 'punto' : m.forma }
      }
      default:
        return { ...m, izq: rec(m.izq), der: rec(m.der) }
    }
  }
  return rec(n)
}
