/**
 * Diagnóstico adaptativo, sin React: solo datos que entran y salen.
 *
 * 1. Empieza por el concepto más alto del mapa.
 * 2. Hace 2 preguntas por concepto. 2 de 2 = dominado; si no, no dominado.
 * 3. Si lo domina, se asume que también domina todo lo que va antes.
 *    Si no, se asume que tampoco domina lo que se construye encima.
 * 4. Si no, busca entre sus prerrequisitos sin revisar. Elige el del medio
 *    (como una búsqueda binaria) para encontrar rápido dónde se rompe la base.
 * 5. Termina cuando no queda nada útil que preguntar o se llega al máximo.
 */
import { conceptoMeta, conceptos, type ConceptoId } from '../content/concepts'
import { ancestros, descendientes, ordenTopologico } from '../content/grafo'
import type { Registro, Veredicto } from '../storage/schema'

export const PREGUNTAS_POR_CONCEPTO = 2
export const MAX_PREGUNTAS = 12

export type Resultado = { veredicto: 'dominado' | 'no-dominado'; inferido: boolean }

export type EstadoDiagnostico = {
  resultados: Partial<Record<ConceptoId, Resultado>>
  /** Concepto que se está preguntando, o null si ya terminó. */
  actual: ConceptoId | null
  /** Aciertos en el concepto actual. */
  respuestasActual: boolean[]
  historial: Registro[]
}

const ids = () => ordenTopologico()

export function iniciar(meta: ConceptoId = conceptoMeta): EstadoDiagnostico {
  return { resultados: {}, actual: meta, respuestasActual: [], historial: [] }
}

export function terminado(e: EstadoDiagnostico): boolean {
  return e.actual === null
}

/** Elige el siguiente concepto a revisar, o null si ya no hace falta. */
export function siguienteConcepto(e: EstadoDiagnostico): ConceptoId | null {
  if (e.historial.length + PREGUNTAS_POR_CONCEPTO > MAX_PREGUNTAS) return null

  const fallados = ids().filter((id) => e.resultados[id]?.veredicto === 'no-dominado')
  const candidatos = ids().filter(
    (id) => !e.resultados[id] && fallados.some((f) => ancestros(f).has(id)),
  )
  if (candidatos.length === 0) return null

  // Ordenados de más básico a más avanzado; tomamos el del medio (hacia arriba).
  candidatos.sort((a, b) => ancestros(a).size - ancestros(b).size)
  return candidatos[Math.floor(candidatos.length / 2)]
}

export function responder(e: EstadoDiagnostico, r: Omit<Registro, 'concepto'>): EstadoDiagnostico {
  if (!e.actual) return e
  const concepto = e.actual
  const historial = [...e.historial, { ...r, concepto }]
  const respuestasActual = [...e.respuestasActual, r.correcto]

  if (respuestasActual.length < PREGUNTAS_POR_CONCEPTO) {
    return { ...e, historial, respuestasActual }
  }

  const resultados = { ...e.resultados }
  if (respuestasActual.every(Boolean)) {
    resultados[concepto] = { veredicto: 'dominado', inferido: false }
    for (const a of ancestros(concepto)) {
      if (!resultados[a]) resultados[a] = { veredicto: 'dominado', inferido: true }
    }
  } else {
    resultados[concepto] = { veredicto: 'no-dominado', inferido: false }
    // Si falla aquí, lo que se construye encima tampoco lo va a poder resolver.
    for (const d of descendientes(concepto)) {
      if (!resultados[d]) resultados[d] = { veredicto: 'no-dominado', inferido: true }
    }
  }

  const siguiente: EstadoDiagnostico = { resultados, actual: null, respuestasActual: [], historial }
  siguiente.actual = siguienteConcepto(siguiente)
  return siguiente
}

/** Veredicto final de cada concepto. Lo que no se revisó queda "sin-probar". */
export function veredictos(e: EstadoDiagnostico): Record<ConceptoId, Veredicto> {
  const r = {} as Record<ConceptoId, Veredicto>
  for (const id of ids()) r[id] = e.resultados[id]?.veredicto ?? 'sin-probar'
  return r
}

// --- Lectura del resultado para el mapa ---

export type EstadoMapa = 'dominado' | 'siguiente' | 'bloqueado'

/**
 * dominado: ya lo sabe.
 * siguiente: le falta y ya puede aprenderlo (sus prerrequisitos están dominados).
 * bloqueado: primero necesita otros conceptos.
 */
export function estadosMapa(v: Partial<Record<string, Veredicto>>): Record<ConceptoId, EstadoMapa> {
  const r = {} as Record<ConceptoId, EstadoMapa>
  for (const id of ids()) {
    if (v[id] === 'dominado') r[id] = 'dominado'
    else if (conceptos[id].prerrequisitos.every((p) => v[p] === 'dominado')) r[id] = 'siguiente'
    else r[id] = 'bloqueado'
  }
  return r
}

/** Lo que falta aprender, en orden: cada concepto después de sus prerrequisitos. */
export function rutaRecomendada(v: Partial<Record<string, Veredicto>>): ConceptoId[] {
  return ids().filter((id) => v[id] !== 'dominado')
}
