import { Fraction } from '../../engine/fraction'
import type { Nodo } from '../../expr/ast'
import { analizar, forma } from './lineal'
import type { ReglaEcuacion } from './pasos'

/**
 * Errores típicos al resolver una ecuación. Cada uno es una forma
 * equivocada de resolver: se calcula a qué resultado lleva, y si coincide
 * con lo que escribió el estudiante, se le explica ese error.
 */
export type ErrorEcuacion =
  | 'signo-x'
  | 'signo-numero'
  | 'dividir-un-termino'
  | 'restar-coeficiente'
  | 'dividir-al-reves'
  | 'signo-division'
  | 'distribuir'
  | 'menos-parentesis'

export const ERRORES: Record<ErrorEcuacion, { mensaje: string; regla: ReglaEcuacion }> = {
  'signo-x': {
    mensaje:
      'Parece que pasaste el término con x al otro lado sin cambiarle el signo. Lo que de verdad haces es restarlo (o sumarlo) en los dos lados, y por eso del otro lado aparece con el signo contrario.',
    regla: 'mover-x',
  },
  'signo-numero': {
    mensaje:
      'Parece que pasaste un número al otro lado sin cambiarle el signo. Si está sumando, para quitarlo hay que restarlo en los dos lados (y al revés).',
    regla: 'mover-numero',
  },
  'dividir-un-termino': {
    mensaje:
      'Parece que dividiste solo una parte. Al dividir, se divide todo lo que hay en cada lado, no solo un término. Lo más fácil: primero deja sola la parte con x y después divide.',
    regla: 'dividir',
  },
  'restar-coeficiente': {
    mensaje:
      'El número pegado a la x la está multiplicando. Para quitarlo hay que dividir los dos lados entre ese número, no restarlo.',
    regla: 'dividir',
  },
  'dividir-al-reves': {
    mensaje: 'Dividiste al revés: si 3x = 12, entonces x = 12 ÷ 3. El número que acompaña a la x va abajo.',
    regla: 'dividir',
  },
  'signo-division': {
    mensaje: 'Revisa el signo al dividir: si divides entre un número negativo, el resultado cambia de signo.',
    regla: 'dividir',
  },
  distribuir: {
    mensaje:
      'Parece que el número de afuera del paréntesis multiplicó solo al primer término. Tiene que multiplicar a todos los términos de adentro.',
    regla: 'quitar-parentesis',
  },
  'menos-parentesis': {
    mensaje: 'Un menos delante del paréntesis cambia el signo de todos los términos de adentro, no solo del primero.',
    regla: 'quitar-parentesis',
  },
}

/** Lo que da la ecuación ax + b = cx + d, o null si no tiene una sola solución. */
const despejar = (a: Fraction, b: Fraction, c: Fraction, d: Fraction) => {
  const A = a.sub(c)
  return A.isZero() ? null : d.sub(b).div(A)
}

/** A qué valor lleva cada error en esta ecuación. Solo los que aplican y dan algo distinto. */
export function erroresPosibles(ast: Nodo): { id: ErrorEcuacion; valor: Fraction }[] {
  const an = analizar(ast)
  if (!an.ok) return []
  const { a, b } = forma(an.izq)
  const { a: c, b: d } = forma(an.der)
  const correcto = despejar(a, b, c, d)
  const r: { id: ErrorEcuacion; valor: Fraction }[] = []
  const agregar = (id: ErrorEcuacion, v: Fraction | null) => {
    if (!v) return
    if (correcto && v.equals(correcto)) return
    if (r.some((e) => e.valor.equals(v))) return
    r.push({ id, valor: v })
  }
  const uno = Fraction.uno
  const A = a.sub(c)
  const D = d.sub(b)

  // Quitar paréntesis mal: se resuelve bien todo lo demás.
  for (const [id, error] of [
    ['distribuir', 'distribuir-uno'],
    ['menos-parentesis', 'menos-uno'],
  ] as const) {
    const mal = analizar(ast, error)
    if (!mal.ok) continue
    const fi = forma(mal.izq)
    const fd = forma(mal.der)
    agregar(id, despejar(fi.a, fi.b, fd.a, fd.b))
  }

  // Pasar al otro lado sin cambiar el signo.
  if (!c.isZero() && !a.isZero()) {
    const s = a.add(c)
    agregar('signo-x', s.isZero() ? null : D.div(s))
  }
  if (!b.isZero() && !A.isZero()) agregar('signo-numero', d.add(b).div(A))

  if (!A.isZero() && !A.equals(uno)) {
    // Ax + b = d → x + b = d/A
    if (!b.isZero()) agregar('dividir-un-termino', d.div(A).sub(b))
    if (!b.isZero()) agregar('dividir-un-termino', d.sub(b.div(A)))
    // Ax = D → x = D − A
    if (!A.equals(uno.neg())) agregar('restar-coeficiente', D.sub(A))
    // Ax = D → x = A/D
    if (!D.isZero() && !A.equals(uno.neg())) agregar('dividir-al-reves', A.div(D))
    if (A.num < 0 && !D.isZero()) agregar('signo-division', D.div(A).neg())
  }
  return r
}
