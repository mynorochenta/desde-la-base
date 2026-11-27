import { Fraction } from '../engine/fraction'
import type { Nodo } from './ast'

/**
 * Evaluador exacto, independiente de los motores: es la "segunda opinión"
 * con la que se verifica cada resultado antes de mostrarlo.
 */

export type Valor =
  | { ok: true; valor: Fraction }
  | { ok: false; motivo: 'division-cero' | 'cero-a-la-cero' | 'variable' | 'demasiado-grande' | 'exponente' | 'igualdad' }

/** El exponente más grande que aceptamos, para que las cuentas no se disparen. */
export const EXPONENTE_MAXIMO = 12

class Corte extends Error {
  readonly motivo: Extract<Valor, { ok: false }>['motivo']
  constructor(motivo: Extract<Valor, { ok: false }>['motivo']) {
    super(motivo)
    this.motivo = motivo
  }
}

export function potencia(base: Fraction, exp: number): Fraction {
  if (exp === 0) {
    if (base.isZero()) throw new Corte('cero-a-la-cero')
    return Fraction.uno
  }
  if (exp < 0) {
    if (base.isZero()) throw new Corte('division-cero')
    return potencia(base.inv(), -exp)
  }
  let r = Fraction.uno
  for (let k = 0; k < exp; k++) r = r.mul(base)
  return r
}

function ev(n: Nodo, vars: Record<string, Fraction>): Fraction {
  switch (n.tipo) {
    case 'num':
      return Fraction.of(n.valor)
    case 'var': {
      const v = vars[n.nombre]
      if (!v) throw new Corte('variable')
      return v
    }
    case 'mixto':
      return Fraction.of(n.entero * n.den + n.num, n.den)
    case 'neg':
      return ev(n.arg, vars).neg()
    case 'par':
      return ev(n.arg, vars)
    case 'suma':
      return ev(n.izq, vars).add(ev(n.der, vars))
    case 'resta':
      return ev(n.izq, vars).sub(ev(n.der, vars))
    case 'producto':
      return ev(n.izq, vars).mul(ev(n.der, vars))
    case 'division':
    case 'frac': {
      const a = n.tipo === 'frac' ? n.num : n.izq
      const b = n.tipo === 'frac' ? n.den : n.der
      const d = ev(b, vars)
      if (d.isZero()) throw new Corte('division-cero')
      return ev(a, vars).div(d)
    }
    case 'pot': {
      const e = ev(n.exp, vars)
      if (!e.isInteger() || Math.abs(e.num) > EXPONENTE_MAXIMO) throw new Corte('exponente')
      return potencia(ev(n.base, vars), e.num)
    }
    case 'igual':
      throw new Corte('igualdad')
  }
}

/** Valor exacto de una expresión. `vars` da el valor de cada letra, si hay. */
export function evaluar(n: Nodo, vars: Record<string, Fraction> = {}): Valor {
  try {
    return { ok: true, valor: ev(n, vars) }
  } catch (e) {
    if (e instanceof Corte) return { ok: false, motivo: e.motivo }
    // Fraction lanza RangeError cuando un número ya no es un entero seguro.
    if (e instanceof RangeError) return { ok: false, motivo: 'demasiado-grande' }
    throw e
  }
}
