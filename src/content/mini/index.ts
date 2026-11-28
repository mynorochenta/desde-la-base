import type { ConceptoId } from '../concepts'
import { ecuacionesLineales } from './ecuaciones-lineales'
import { enteros } from './enteros'
import { fraccionesMultiplicacion } from './fracciones-multiplicacion'
import { fraccionesSimplificar } from './fracciones-simplificar'
import { fraccionesSuma } from './fracciones-suma'
import { jerarquia } from './jerarquia'
import { potencias } from './potencias'
import { signos } from './signos'
import type { MiniLeccion } from './tipos'

export type { MiniLeccion } from './tipos'

/** Mini lecciones escritas a mano, una por concepto. */
export const minis: Record<ConceptoId, MiniLeccion> = {
  enteros,
  signos,
  jerarquia,
  'fracciones-simplificar': fraccionesSimplificar,
  'fracciones-suma': fraccionesSuma,
  'fracciones-multiplicacion': fraccionesMultiplicacion,
  potencias,
  'ecuaciones-lineales': ecuacionesLineales,
}
