import { conceptos, type ConceptoId } from '../content/concepts'
import { minis } from '../content/mini'

/** Lee `?tema=` de la ruta. Es texto no confiable: solo pasan ids que existen. */
export function leerTemas(param: string | null): ConceptoId[] {
  if (!param) return []
  return param
    .split(',')
    .filter((t): t is ConceptoId => Object.hasOwn(conceptos, t) && minis[t as ConceptoId] !== undefined)
    .filter((t, i, todos) => todos.indexOf(t) === i)
    .slice(0, 8)
}
