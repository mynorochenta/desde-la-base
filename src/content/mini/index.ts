import type { ConceptoId } from '../concepts'
import { enteros } from './enteros'
import { fraccionesMultiplicacion } from './fracciones-multiplicacion'
import { fraccionesSimplificar } from './fracciones-simplificar'
import { fraccionesSuma } from './fracciones-suma'
import { jerarquia } from './jerarquia'
import { potencias } from './potencias'
import { signos } from './signos'
import type { MiniLeccion } from './tipos'

export type { MiniLeccion } from './tipos'

/** Mini lecciones escritas a mano. Las ecuaciones llegan con su motor. */
export const minis: Partial<Record<ConceptoId, MiniLeccion>> = {
  enteros,
  signos,
  jerarquia,
  'fracciones-simplificar': fraccionesSimplificar,
  'fracciones-suma': fraccionesSuma,
  'fracciones-multiplicacion': fraccionesMultiplicacion,
  potencias,
}
