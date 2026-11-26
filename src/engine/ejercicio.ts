import type { Fraction } from './fraction'
import type { Borrador, ErrorComun, Ejercicio } from './types'

/** Calcula el valor de un error solo si tiene sentido (por ejemplo, sin dividir entre cero). */
export function intentar(calc: () => Fraction): Fraction | null {
  try {
    return calc()
  } catch {
    return null
  }
}

/**
 * Convierte un borrador en ejercicio: quita errores que no aplican, que
 * coinciden con la respuesta correcta o que se repiten (gana el primero).
 */
export function armar(concepto: string, semilla: number, b: Borrador): Ejercicio {
  const errores: ErrorComun[] = []
  for (const e of b.errores) {
    if (!e.valor) continue
    if (e.valor.equals(b.respuesta)) continue
    if (errores.some((x) => x.valor.equals(e.valor!))) continue
    errores.push({ id: e.id, valor: e.valor, mensaje: e.mensaje })
  }
  return { ...b, concepto, semilla, pedirSimplificada: b.pedirSimplificada ?? false, errores }
}
