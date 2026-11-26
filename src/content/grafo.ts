import { conceptos, type Concepto, type ConceptoId } from './concepts'

const todos = () => Object.values(conceptos) as Concepto[]

/** Todos los prerrequisitos, directos e indirectos. */
export function ancestros(id: ConceptoId): Set<ConceptoId> {
  const vistos = new Set<ConceptoId>()
  const pila = [...conceptos[id].prerrequisitos]
  while (pila.length) {
    const p = pila.pop()!
    if (vistos.has(p)) continue
    vistos.add(p)
    pila.push(...conceptos[p].prerrequisitos)
  }
  return vistos
}

/** Conceptos que dependen de este, directa o indirectamente. */
export function descendientes(id: ConceptoId): Set<ConceptoId> {
  const r = new Set<ConceptoId>()
  for (const c of todos()) if (ancestros(c.id).has(id)) r.add(c.id)
  return r
}

/** Orden en que se aprenden: cada concepto aparece después de sus prerrequisitos. */
export function ordenTopologico(): ConceptoId[] {
  const orden: ConceptoId[] = []
  const estado = new Map<ConceptoId, 'visitando' | 'listo'>()
  const visitar = (id: ConceptoId) => {
    const e = estado.get(id)
    if (e === 'listo') return
    if (e === 'visitando') throw new Error(`Ciclo en el mapa de conceptos en "${id}"`)
    estado.set(id, 'visitando')
    for (const p of conceptos[id].prerrequisitos) visitar(p)
    estado.set(id, 'listo')
    orden.push(id)
  }
  for (const c of todos()) visitar(c.id)
  return orden
}

/** Revisa que el mapa esté bien armado. Devuelve la lista de problemas (vacía si todo bien). */
export function validarGrafo(): string[] {
  const problemas: string[] = []
  for (const [clave, c] of Object.entries(conceptos)) {
    if (clave !== c.id) problemas.push(`La clave "${clave}" no coincide con el id "${c.id}"`)
    for (const p of c.prerrequisitos) {
      if (!(p in conceptos)) problemas.push(`"${c.id}" pide "${p}", que no existe`)
    }
  }
  try {
    ordenTopologico()
  } catch (e) {
    problemas.push((e as Error).message)
  }
  return problemas
}
