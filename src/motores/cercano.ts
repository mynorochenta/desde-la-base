import type { ConceptoId } from '../content/concepts'
import { recorrer, variables, type Nodo } from '../expr/ast'
import { EXPONENTE_MAXIMO, evaluar } from '../expr/evaluar'
import { analizar } from './ecuacion-lineal/lineal'

/**
 * Cuando ningún motor puede con un problema, sugerimos el tema de Aprender
 * que más se le parece, mirando qué hay en el árbol.
 */
export function temaCercano(ast: Nodo): ConceptoId {
  if (ast.tipo === 'igual' && variables(ast).length === 0) return tema(ast.izq)
  if (ast.tipo === 'igual' || variables(ast).length > 0) return 'ecuaciones-lineales'
  return tema(ast)
}

function tema(ast: Nodo): ConceptoId {
  const tipos = new Set([...recorrer(ast)].map((n) => n.tipo))
  if (tipos.has('pot')) return 'potencias'
  if (tipos.has('frac') || tipos.has('mixto')) {
    return tipos.has('suma') || tipos.has('resta') ? 'fracciones-suma' : 'fracciones-multiplicacion'
  }
  const operaciones = ['suma', 'resta', 'producto', 'division'].filter((t) => tipos.has(t as Nodo['tipo']))
  if (operaciones.length > 1 || tipos.has('par')) return 'jerarquia'
  if (tipos.has('neg')) return 'signos'
  return 'enteros'
}

const LISTA = (ls: string[]) => (ls.length === 2 ? `${ls[0]} y ${ls[1]}` : `${ls.slice(0, -1).join(', ')} y ${ls.at(-1)}`)

/**
 * Por qué ningún motor puede con el problema, en palabras sencillas.
 * null si no hay una razón clara (entonces solo se dice que todavía no se sabe).
 */
export function porQueNo(ast: Nodo): string | null {
  const letras = variables(ast)
  if (ast.tipo === 'igual' || letras.length) {
    const an = analizar(ast)
    if (an.ok) return null
    const x = letras[0] ?? 'x'
    switch (an.motivo) {
      case 'sin-igual':
        return `Es una expresión con letra, pero no tiene signo =, así que no hay nada que despejar. Si es una ecuación, revisa que tenga el =. Todavía no simplifico expresiones con letras.`
      case 'sin-letra':
        return 'No tiene letra: es una igualdad entre números. Si quieres saber cuánto da un lado, escríbelo solo, sin el =.'
      case 'varias-letras':
        return `Tiene ${letras.length} letras (${LISTA(letras)}). Con una sola ecuación no se puede encontrar el valor de cada una: hacen falta tantas ecuaciones como letras. Por ahora resuelvo ecuaciones con una sola letra.`
      case 'cuadratica':
        return `Tiene ${x}² (o una ${x} multiplicada por otra ${x}), así que es una ecuación cuadrática, no lineal. Esas todavía no las resuelvo.`
      case 'letra-abajo':
        return `La ${x} está abajo, en el denominador de una fracción. Esa ecuación no es lineal y todavía no la resuelvo.`
      case 'letra-exponente':
        return `La ${x} tiene un exponente (o está en un exponente), así que la ecuación no es lineal. Todavía no la resuelvo.`
      case 'division-cero':
        return 'Hay una división entre 0, que no está definida, así que la ecuación no tiene sentido como está escrita.'
      case 'demasiado-grande':
        return 'Los números son demasiado grandes para explicarlo paso a paso.'
    }
  }
  const v = evaluar(ast)
  if (!v.ok && v.motivo === 'exponente') return `Solo resuelvo potencias con exponentes enteros de hasta ${EXPONENTE_MAXIMO}.`
  if (!v.ok && v.motivo === 'demasiado-grande') return 'Los números son demasiado grandes para explicarlo paso a paso.'
  return null
}
