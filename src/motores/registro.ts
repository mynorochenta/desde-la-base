import { evaluar } from '../expr/evaluar'
import type { Nodo } from '../expr/ast'
import type { Motor, Solucion } from './tipos'

/**
 * Encuentra los motores solos: cada carpeta src/motores/<id>/motor.ts que
 * exporta `motor` queda registrada. Agregar un motor no toca este archivo.
 */
const modulos = import.meta.glob<{ motor: Motor<unknown> }>('./*/motor.ts', { eager: true })

export const motores: Motor<unknown>[] = Object.values(modulos)
  .map((m) => m.motor)
  .sort((a, b) => a.prioridad - b.prioridad)

export type Despacho =
  | { estado: 'resuelto'; motor: Motor<unknown>; problema: unknown; solucion: Solucion }
  /** Ningún motor reconoce el problema. */
  | { estado: 'no-reconocido' }
  /** Un motor lo reconoció, pero su resultado no pasó la verificación: no se muestra. */
  | { estado: 'no-verificado'; motor: Motor<unknown> }

/**
 * En una expresión sin igualdad, cada frame de cada paso tiene que valer lo
 * mismo que el resultado; en una ecuación, cada frame se tiene que cumplir
 * con la solución. Si el resultado es "no definido", no se revisa.
 */
function conservaValor(s: Solucion): boolean {
  const res = s.resultado
  if (res.tipo === 'solucion') {
    // En una ecuación, cada frame tiene que cumplirse con la solución.
    return s.pasos.every((p) =>
      p.frames.every((f) => {
        if (f.expr.tipo !== 'igual') return true
        const vars = { [res.variable]: res.valor }
        const a = evaluar(f.expr.izq, vars)
        const b = evaluar(f.expr.der, vars)
        return a.ok && b.ok && a.valor.equals(b.valor)
      }),
    )
  }
  if (s.resultado.tipo !== 'valor') return true
  const r = s.resultado.valor
  return s.pasos.every((p) =>
    p.frames.every((f) => {
      if (f.expr.tipo === 'igual') return true
      const v = evaluar(f.expr)
      return v.ok && v.valor.equals(r)
    }),
  )
}

/** Usa el primer motor que reconoce el problema, y solo devuelve soluciones verificadas. */
export function despachar(ast: Nodo, lista: Motor<unknown>[] = motores): Despacho {
  for (const motor of lista) {
    let problema: unknown
    try {
      problema = motor.detectar(ast)
    } catch {
      continue
    }
    if (problema === null || problema === undefined) continue
    try {
      const solucion = motor.resolver(problema)
      if (motor.comprobar(problema, solucion) && conservaValor(solucion)) {
        return { estado: 'resuelto', motor, problema, solucion }
      }
    } catch {
      // Un motor que falla nunca muestra un resultado a medias.
    }
    return { estado: 'no-verificado', motor }
  }
  return { estado: 'no-reconocido' }
}
