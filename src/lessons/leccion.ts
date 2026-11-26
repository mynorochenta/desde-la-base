import { conceptos, type ConceptoId } from '../content/concepts'
import { ancestros } from '../content/grafo'
import type { Progreso } from '../storage/schema'

/** Conceptos que la persona domina, juntando el diagnóstico y las lecciones. */
export function dominados(p: Progreso): Set<ConceptoId> {
  const r = new Set<ConceptoId>()
  for (const [id, v] of Object.entries(p.diagnostico?.veredictos ?? {})) if (v === 'dominado') r.add(id as ConceptoId)
  for (const [id, c] of Object.entries(p.conceptos)) if (c.dominado) r.add(id as ConceptoId)
  return new Set([...r].filter((id) => id in conceptos))
}

/** Guarda en qué paso va la lección. Solo avanza: volver atrás no borra lo logrado. */
export function guardarPaso(p: Progreso, leccion: string, paso: number, fecha = Date.now()): Progreso {
  const prev = p.lecciones[leccion]
  return {
    ...p,
    lecciones: {
      ...p.lecciones,
      [leccion]: { paso: Math.max(prev?.paso ?? 0, paso), completada: prev?.completada ?? false, fecha },
    },
  }
}

/**
 * Marca la lección como completada: su concepto (y lo que va antes) queda
 * dominado. Devuelve también qué conceptos se desbloquearon.
 */
export function completarLeccion(
  p: Progreso,
  leccion: string,
  concepto: ConceptoId,
  pasoFinal: number,
  fecha = Date.now(),
): { progreso: Progreso; desbloqueados: ConceptoId[] } {
  const antes = dominados(p)
  const nuevos = { ...p.conceptos }
  nuevos[concepto] = { dominado: true, fuente: 'leccion', fecha }
  for (const a of ancestros(concepto)) {
    if (!nuevos[a]?.dominado) nuevos[a] = { dominado: true, fuente: 'leccion', fecha }
  }
  const progreso: Progreso = {
    ...p,
    conceptos: nuevos,
    lecciones: { ...p.lecciones, [leccion]: { paso: pasoFinal, completada: true, fecha } },
  }
  const despues = dominados(progreso)
  const desbloqueados = (Object.keys(conceptos) as ConceptoId[]).filter(
    (id) =>
      !despues.has(id) &&
      conceptos[id].prerrequisitos.every((r) => despues.has(r)) &&
      !conceptos[id].prerrequisitos.every((r) => antes.has(r)),
  )
  return { progreso, desbloqueados }
}
