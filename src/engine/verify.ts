import { leerRespuesta } from './parse'
import type { Ejercicio } from './types'

export type Resultado =
  | { estado: 'correcto'; mensaje: string }
  /** El valor es correcto, pero faltó simplificar. */
  | { estado: 'casi'; mensaje: string }
  /** errorId es null si no reconocimos el error. */
  | { estado: 'incorrecto'; mensaje: string; errorId: string | null }
  /** No se pudo leer la respuesta: no cuenta como intento. */
  | { estado: 'invalido'; mensaje: string }

/**
 * Revisa una respuesta sin IA: compara el valor exacto y, si está mal,
 * busca cuál error común explica ese resultado.
 */
export function verificar(ej: Ejercicio, entrada: string): Resultado {
  const lectura = leerRespuesta(entrada)
  if (!lectura.ok) return { estado: 'invalido', mensaje: lectura.mensaje }

  const v = lectura.valor
  const r = ej.respuesta

  if (v.equals(r)) {
    if (ej.pedirSimplificada && !lectura.simplificada) {
      return {
        estado: 'casi',
        mensaje: r.isInteger()
          ? `El valor está bien, pero se puede escribir más sencillo: ${r.toString()}.`
          : 'El valor está bien, pero todavía se puede simplificar. Divide arriba y abajo por el mismo número.',
      }
    }
    return { estado: 'correcto', mensaje: 'Correcto.' }
  }

  // 1. Errores que conoce el propio ejercicio
  const propio = ej.errores.find((e) => e.valor.equals(v))
  if (propio) return { estado: 'incorrecto', mensaje: propio.mensaje, errorId: propio.id }

  // 2. Reglas generales
  if (!r.isZero() && v.equals(r.neg())) {
    return { estado: 'incorrecto', mensaje: 'El número está bien, pero revisa el signo.', errorId: 'signo' }
  }
  if (!r.isZero() && !r.isInteger() && v.equals(r.inv())) {
    return {
      estado: 'incorrecto',
      mensaje: 'Parece que volteaste la fracción: el de arriba va abajo y el de abajo va arriba.',
      errorId: 'volteada',
    }
  }
  if (!r.isZero() && !r.isInteger() && v.equals(r.inv().neg())) {
    return { estado: 'incorrecto', mensaje: 'La fracción quedó volteada y con el signo cambiado.', errorId: 'volteada-signo' }
  }

  return { estado: 'incorrecto', mensaje: `Todavía no. ${ej.pista}`, errorId: null }
}
