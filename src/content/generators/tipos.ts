import type { Rng } from '../../engine/rng'
import type { Borrador } from '../../engine/types'

export type Plantilla = (r: Rng) => Borrador

/** Las plantillas de un concepto, por nombre de tipo. */
export type Plantillas = Record<string, Plantilla>
