import type { ConceptoId } from '../concepts'
import { armar } from '../../engine/ejercicio'
import { crearRng, semillaNueva } from '../../engine/rng'
import type { Ejercicio } from '../../engine/types'
import { ecuacionesLineales } from './ecuaciones'
import { enteros } from './enteros'
import { fraccionesMultiplicacion, fraccionesSimplificar, fraccionesSuma } from './fracciones'
import { jerarquia } from './jerarquia'
import { potencias } from './potencias'
import { signos } from './signos'
import type { Plantillas } from './tipos'

export const plantillas: Record<ConceptoId, Plantillas> = {
  enteros,
  signos,
  jerarquia,
  'fracciones-simplificar': fraccionesSimplificar,
  'fracciones-suma': fraccionesSuma,
  'fracciones-multiplicacion': fraccionesMultiplicacion,
  potencias,
  'ecuaciones-lineales': ecuacionesLineales,
}

/**
 * Genera un ejercicio. Con la misma semilla (y tipo) siempre sale el mismo.
 * Si no das tipo, se elige uno al azar con la misma semilla.
 */
export function generar(concepto: ConceptoId, semilla = semillaNueva(), tipo?: string): Ejercicio {
  const r = crearRng(semilla)
  const delConcepto = plantillas[concepto]
  const nombre = tipo ?? r.pick(Object.keys(delConcepto))
  const plantilla = delConcepto[nombre]
  if (!plantilla) throw new Error(`No existe el tipo "${nombre}" en "${concepto}"`)
  return armar(concepto, semilla, plantilla(r))
}
