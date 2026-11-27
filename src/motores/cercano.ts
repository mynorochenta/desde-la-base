import type { ConceptoId } from '../content/concepts'
import { recorrer, variables, type Nodo } from '../expr/ast'

/**
 * Cuando ningún motor puede con un problema, sugerimos el tema de Aprender
 * que más se le parece, mirando qué hay en el árbol.
 */
export function temaCercano(ast: Nodo): ConceptoId {
  const tipos = new Set([...recorrer(ast)].map((n) => n.tipo))
  if (ast.tipo === 'igual' || variables(ast).length > 0) return 'ecuaciones-lineales'
  if (tipos.has('pot')) return 'potencias'
  if (tipos.has('frac') || tipos.has('mixto')) {
    return tipos.has('suma') || tipos.has('resta') ? 'fracciones-suma' : 'fracciones-multiplicacion'
  }
  const operaciones = ['suma', 'resta', 'producto', 'division'].filter((t) => tipos.has(t as Nodo['tipo']))
  if (operaciones.length > 1 || tipos.has('par')) return 'jerarquia'
  if (tipos.has('neg')) return 'signos'
  return 'enteros'
}
