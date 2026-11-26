import type { Fraction } from './fraction'

/** Entero con paréntesis si es negativo: 3 → "3", -3 → "(-3)". */
export const par = (n: number) => (n < 0 ? `(${n})` : `${n}`)

/** Fracción en LaTeX (ya simplificada). */
export function fr(x: Fraction): string {
  if (x.den === 1) return `${x.num}`
  return `${x.num < 0 ? '-' : ''}\\frac{${Math.abs(x.num)}}{${x.den}}`
}

/** Fracción con paréntesis si es negativa. */
export const frPar = (x: Fraction) => (x.num < 0 ? `\\left(${fr(x)}\\right)` : fr(x))

/** Fracción tal cual, sin simplificar (para ejercicios de simplificar). */
export const crudo = (num: number, den: number) => `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`

/** Término con x: 1 → "x", -1 → "-x", 3 → "3x". */
export const tx = (a: number) => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`)

/** Sumando después de otro término: 5 → " + 5", -5 → " - 5". */
export const mas = (b: number) => (b < 0 ? ` - ${-b}` : ` + ${b}`)
