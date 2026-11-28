import type { ConceptoId } from '../concepts'

/**
 * Mini lección del árbol del porqué: la regla en pocas frases, uno o más
 * ejemplos y, si hace falta, el error que más se comete. Los ejercicios
 * para probar salen de los generadores de Aprender.
 */
export type MiniLeccion = {
  concepto: ConceptoId
  /** La regla, en una o dos frases sencillas. */
  regla: string
  /** Problemas escritos como los lee el parser, con su explicación. */
  ejemplos: { problema: string; explicacion: string }[]
  /** El error típico, dicho con un ejemplo. */
  cuidado?: string
}
