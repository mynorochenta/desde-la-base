import type { ConceptoId } from '../content/concepts'
import { generar } from '../content/generators'
import { semillaNueva } from '../engine/rng'
import type { Ejercicio } from '../engine/types'
import type { Resultado } from '../engine/verify'

/** Un ejercicio para el diagnóstico, de un tipo distinto al anterior si se puede. */
export function preguntaDiagnostico(concepto: ConceptoId, evitarTipo?: string, semilla = semillaNueva()): Ejercicio {
  let ej = generar(concepto, semilla)
  for (let i = 1; i < 6 && ej.tipo === evitarTipo; i++) ej = generar(concepto, semilla + i)
  return ej
}

/**
 * En el diagnóstico, una fracción sin simplificar cuenta como correcta,
 * menos en el concepto de simplificar (ahí es justo lo que se mide).
 */
export function cuentaComoCorrecto(concepto: ConceptoId, r: Resultado): boolean {
  if (r.estado === 'correcto') return true
  return r.estado === 'casi' && concepto !== 'fracciones-simplificar'
}
