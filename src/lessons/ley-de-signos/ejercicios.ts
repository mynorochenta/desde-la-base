import { generar } from '../../content/generators'
import { crearRng } from '../../engine/rng'
import type { Ejercicio } from '../../engine/types'
import { TIPOS } from './contenido'
import { resta, suma, type Saltos } from './saltos'

/**
 * Una tanda de ejercicios: primero los cuatro tipos en desorden (así ninguno
 * falta) y después tipos al azar, sin repetir el mismo dos veces seguidas.
 */
export function tanda(cantidad: number, semilla: number): Ejercicio[] {
  const r = crearRng(semilla)
  const tipos: string[] = [...TIPOS]
  for (let i = tipos.length - 1; i > 0; i--) {
    const j = r.int(0, i)
    ;[tipos[i], tipos[j]] = [tipos[j], tipos[i]]
  }
  while (tipos.length < cantidad) {
    const t = r.pick(TIPOS.filter((x) => x !== tipos.at(-1)))
    tipos.push(t)
  }
  return tipos.slice(0, cantidad).map((t) => generar('signos', r.int(1, 2 ** 31 - 2), t))
}

/** Para las sumas y restas: el recorrido en la recta. null si no aplica. */
export function saltosDe(ej: Ejercicio): Saltos | null {
  const d = ej.datos
  if (ej.tipo === 'sumaDistinto') return suma(d.x, d.y)
  if (ej.tipo === 'restaNegativo') return resta(d.a, -d.b)
  return null
}
