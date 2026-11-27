import { Fraction } from '../../engine/fraction'
import { potencia } from '../../expr/evaluar'
import type { Nodo } from '../../expr/ast'
import type { Regla } from './pasos'

/**
 * Errores típicos como formas equivocadas de calcular. Cada uno evalúa el
 * problema completo con un solo error; si el resultado coincide con lo que
 * escribió el estudiante, probablemente cometió ese error.
 * Todo es exacto y determinista: no se adivina nada.
 */

export type ErrorId =
  | 'izquierda-a-derecha'
  | 'suma-directa-fracciones'
  | 'entero-mas-fraccion'
  | 'resta-negativo'
  | 'menos-por-menos'
  | 'potencia-por-base'
  | 'potencia-negativa'
  | 'potencia-cero'
  | 'menos-potencia'
  | 'division-sin-voltear'

export type ReglaError = {
  id: ErrorId
  mensaje: string
  /** En qué pasos de la solución se ve el camino correcto. */
  pasos: Regla[]
}

export const ERRORES: ReglaError[] = [
  {
    id: 'izquierda-a-derecha',
    mensaje:
      'Parece que hiciste las operaciones de izquierda a derecha. Primero van las potencias, después las multiplicaciones y divisiones, y al final las sumas y restas.',
    pasos: ['potencia', 'producto', 'producto-fracciones', 'division', 'division-fracciones'],
  },
  {
    id: 'suma-directa-fracciones',
    mensaje:
      'Parece que sumaste arriba con arriba y abajo con abajo. Para sumar o restar fracciones, primero necesitan el mismo denominador; después se suman solo los de arriba.',
    pasos: ['denominador-comun', 'suma-fracciones'],
  },
  {
    id: 'entero-mas-fraccion',
    mensaje:
      'Parece que sumaste el entero solo al número de arriba. Primero escribe el entero como fracción con el mismo denominador: por ejemplo, 2 = 8/4.',
    pasos: ['denominador-comun'],
  },
  {
    id: 'resta-negativo',
    mensaje: 'Revisa la resta de un número negativo: menos por menos da más. Restar −3 es lo mismo que sumar 3.',
    pasos: ['resta-negativo'],
  },
  {
    id: 'menos-por-menos',
    mensaje: 'Revisa los signos de la multiplicación o la división: menos por menos da más.',
    pasos: ['producto', 'producto-fracciones', 'division'],
  },
  {
    id: 'potencia-por-base',
    mensaje: 'Parece que multiplicaste la base por el exponente. El exponente dice cuántas veces se multiplica la base por sí misma: 2³ = 2 · 2 · 2 = 8, no 2 · 3.',
    pasos: ['potencia'],
  },
  {
    id: 'potencia-negativa',
    mensaje: 'Un exponente negativo no hace negativo el resultado: le da vuelta al número. 2^−2 = 1/2² = 1/4.',
    pasos: ['potencia'],
  },
  {
    id: 'potencia-cero',
    mensaje: 'Cualquier número que no sea 0, elevado a la 0, da 1 (no 0).',
    pasos: ['potencia'],
  },
  {
    id: 'menos-potencia',
    mensaje: 'Ojo con el signo: en −3² el exponente solo afecta al 3, así que da −9. Si fuera (−3)², sí daría 9.',
    pasos: ['potencia'],
  },
  {
    id: 'division-sin-voltear',
    mensaje: 'Para dividir fracciones hay que voltear la segunda y después multiplicar. Parece que multiplicaste sin voltearla.',
    pasos: ['division-fracciones'],
  },
]

class Corte extends Error {}

/** Evalúa el problema cometiendo un solo error. null si ese error no aplica o no se puede calcular. */
export function evaluarCon(n: Nodo, error: ErrorId): Fraction | null {
  let aplico = false
  const marca = () => {
    aplico = true
  }

  const ev = (m: Nodo): Fraction => {
    switch (m.tipo) {
      case 'num':
        return Fraction.of(m.valor)
      case 'mixto':
        return Fraction.of(m.entero * m.den + m.num, m.den)
      case 'var':
      case 'igual':
        throw new Corte()
      case 'par':
        return ev(m.arg)
      case 'neg': {
        if (error === 'menos-potencia' && m.arg.tipo === 'pot' && m.arg.base.tipo === 'num') {
          marca()
          return pot(ev(m.arg.base).neg(), ev(m.arg.exp))
        }
        return ev(m.arg).neg()
      }
      case 'pot':
        return pot(ev(m.base), ev(m.exp))
      case 'frac': {
        const d = ev(m.den)
        if (d.isZero()) throw new Corte()
        return ev(m.num).div(d)
      }
      default:
        break
    }
    if (error === 'izquierda-a-derecha' && (m.tipo === 'suma' || m.tipo === 'resta' || m.tipo === 'producto' || m.tipo === 'division')) {
      return cadena(m)
    }
    return binaria(m.tipo, ev(m.izq), ev(m.der))
  }

  const binaria = (tipo: 'suma' | 'resta' | 'producto' | 'division', a: Fraction, b: Fraction): Fraction => {
    const fraccion = (x: Fraction) => !x.isInteger()
    if (tipo === 'suma' || tipo === 'resta') {
      const signo = tipo === 'suma' ? 1 : -1
      if (error === 'suma-directa-fracciones' && fraccion(a) && fraccion(b)) {
        marca()
        return Fraction.of(a.num + signo * b.num, a.den + b.den)
      }
      if (error === 'entero-mas-fraccion' && a.isInteger() && fraccion(b)) {
        marca()
        return Fraction.of(a.num * 1 + signo * b.num, b.den)
      }
      if (error === 'entero-mas-fraccion' && fraccion(a) && b.isInteger()) {
        marca()
        return Fraction.of(a.num + signo * b.num, a.den)
      }
      if (error === 'resta-negativo' && tipo === 'resta' && b.num < 0) {
        marca()
        return a.add(b)
      }
      return tipo === 'suma' ? a.add(b) : a.sub(b)
    }
    if (tipo === 'producto' || tipo === 'division') {
      if (tipo === 'division' && b.isZero()) throw new Corte()
      let r = tipo === 'producto' ? a.mul(b) : a.div(b)
      if (error === 'division-sin-voltear' && tipo === 'division' && fraccion(b)) {
        marca()
        r = a.mul(b)
      }
      if (error === 'menos-por-menos' && a.num < 0 && b.num < 0) {
        marca()
        r = r.neg()
      }
      return r
    }
    throw new Corte()
  }

  const pot = (b: Fraction, e: Fraction): Fraction => {
    if (!e.isInteger() || Math.abs(e.num) > 12) throw new Corte()
    const k = e.num
    if (error === 'potencia-por-base' && k >= 2) {
      marca()
      return b.mul(Fraction.of(k))
    }
    if (error === 'potencia-negativa' && k < 0 && !b.isZero()) {
      marca()
      return potencia(b, -k).neg()
    }
    if (error === 'potencia-cero' && k === 0 && !b.isZero()) {
      marca()
      return Fraction.cero
    }
    return potencia(b, k)
  }

  /** Sin jerarquía: junta toda la cadena de + − · ÷ y la hace de izquierda a derecha. */
  const cadena = (m: Nodo): Fraction => {
    const operandos: Nodo[] = []
    const ops: Array<'suma' | 'resta' | 'producto' | 'division'> = []
    const aplanar = (x: Nodo) => {
      if (x.tipo === 'suma' || x.tipo === 'resta' || x.tipo === 'producto' || x.tipo === 'division') {
        aplanar(x.izq)
        ops.push(x.tipo)
        aplanar(x.der)
      } else operandos.push(x)
    }
    aplanar(m)
    let r = ev(operandos[0])
    ops.forEach((op, i) => {
      r = binaria(op, r, ev(operandos[i + 1]))
    })
    if (ops.length > 1) marca()
    return r
  }

  try {
    const r = ev(n)
    return aplico ? r : null
  } catch {
    return null
  }
}

/** Todos los errores que dan un valor distinto del correcto, sin repetir valores (gana el primero). */
export function erroresPosibles(n: Nodo, correcto: Fraction): Array<ReglaError & { valor: Fraction }> {
  const r: Array<ReglaError & { valor: Fraction }> = []
  for (const e of ERRORES) {
    const v = evaluarCon(n, e.id)
    if (!v || v.equals(correcto) || r.some((x) => x.valor.equals(v))) continue
    r.push({ ...e, valor: v })
  }
  return r
}
