import type { Ejercicio } from '../engine/types'
import { site } from './site'

/**
 * Arma el enlace al formulario externo con los datos del ejercicio ya llenos.
 * No incluye nada personal: solo el ejercicio y lo que la persona escribió.
 */
export function urlReporte(ej: Ejercicio, respuesta: string, comentario: string): string {
  const { url, fields } = site.reportarError
  const u = new URL(url)
  const ejercicio = `${ej.enunciado} ${ej.latex} (tipo ${ej.tipo}, respuesta esperada ${ej.respuesta.toString()})`
  u.searchParams.set(fields.concepto, ej.concepto)
  u.searchParams.set(fields.ejercicio, ejercicio)
  u.searchParams.set(fields.semilla, String(ej.semilla))
  u.searchParams.set(fields.respuesta, respuesta)
  u.searchParams.set(fields.comentario, comentario.slice(0, 500))
  if (u.hostname.endsWith('google.com')) u.searchParams.set('usp', 'pp_url')
  return u.toString()
}
