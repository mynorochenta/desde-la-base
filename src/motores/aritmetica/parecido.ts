import { crearRng } from '../../engine/rng'
import type { Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'
import { latexDe } from '../../expr/tokens'
import { cambiarNumeros as cambiar } from '../cambiar'

/**
 * "Practicar uno igual": misma forma del problema, otros números.
 * Se respetan los ceros, los unos y los exponentes (cambiarlos cambia el tipo
 * de problema), y el tamaño de cada número. Se repite hasta que el
 * resultado sea sencillo.
 */

const INTENTOS = 60

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
