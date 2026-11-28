import { Fraction } from '../../engine/fraction'
import { leerRespuesta } from '../../engine/parse'
import { crearRng } from '../../engine/rng'
import { recorrer, type Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'
import { latexDe } from '../../expr/tokens'
import { cambiarNumeros } from '../cambiar'
import type { Motor, Revision, Solucion } from '../tipos'
import { ERRORES, erroresPosibles } from './errores'
import { analizar } from './lineal'
import { numero, resolverEcuacion, type SolucionEcuacion } from './pasos'

/**
 * Motor de ecuaciones lineales con una letra: 2x − 1 = 8x + 11.
 * Se explica con la balanza: lo que hagas en un lado, hazlo en el otro.
 */

export type ProblemaEcuacion = { ast: Nodo & { tipo: 'igual' }; letra: string }

const NODOS_MAXIMOS = 80

export function detectarEcuacion(ast: Nodo): ProblemaEcuacion | null {
  if (ast.tipo !== 'igual') return null
  if ([...recorrer(ast)].length > NODOS_MAXIMOS) return null
  const an = analizar(ast)
  return an.ok ? { ast, letra: an.letra } : null
}

/** izquierda − derecha, con la letra valiendo v. null si no se puede calcular. */
function diferencia(p: ProblemaEcuacion, v: Fraction): Fraction | null {
  const vars = { [p.letra]: v }
  const a = evaluar(p.ast.izq, vars)
  const b = evaluar(p.ast.der, vars)
  return a.ok && b.ok ? a.valor.sub(b.valor) : null
}

/**
 * Comprobación independiente: se sustituye en la ecuación original con el
 * evaluador. Como la ecuación es lineal, izquierda − derecha es una recta:
 * con dos o tres valores se sabe si tiene una solución, ninguna o infinitas.
 */
export function comprobarEcuacion(p: ProblemaEcuacion, s: Solucion): boolean {
  const f0 = diferencia(p, Fraction.cero)
  const f1 = diferencia(p, Fraction.uno)
  const f2 = diferencia(p, Fraction.of(2))
  if (!f0 || !f1 || !f2) return false
  // Una recta: los saltos entre 0, 1 y 2 tienen que ser iguales.
  if (!f1.sub(f0).equals(f2.sub(f1))) return false
  const pendiente = f1.sub(f0)
  const r = s.resultado
  if (r.tipo === 'solucion') {
    const fv = diferencia(p, r.valor)
    return r.variable === p.letra && !!fv && fv.isZero() && !pendiente.isZero()
  }
  if (r.tipo === 'infinitas') return pendiente.isZero() && f0.isZero()
  if (r.tipo === 'sin-solucion') return pendiente.isZero() && !f0.isZero()
  return false
}

const NO_TIENE = /^\s*(no|ning|sin)/i
const INFINITAS = /^\s*(inf|todo|cualq|tod)/i

function indiceDe(s: SolucionEcuacion, regla: string): number | undefined {
  const i = s.pasos.findIndex((p) => p.regla === regla)
  return i === -1 ? undefined : i
}

export function revisarEcuacion(p: ProblemaEcuacion, respuesta: string): Revision {
  const sol = resolverEcuacion(p.ast)
  const r = sol.resultado
  const l = p.letra
  const texto = respuesta.trim()
  const sinSolucion = NO_TIENE.test(texto)
  const infinitas = INFINITAS.test(texto)

  if (r.tipo === 'sin-solucion' || r.tipo === 'infinitas') {
    const bien = r.tipo === 'sin-solucion' ? sinSolucion : infinitas
    if (bien) {
      return {
        estado: 'correcto',
        mensaje: r.tipo === 'sin-solucion' ? `Correcto: la ${l} se cancela y queda algo falso, así que no tiene solución.` : `Correcto: la ${l} se cancela y queda algo que siempre es cierto, así que cualquier número sirve.`,
      }
    }
    const paso = indiceDe(sol, 'sin-x')
    const mensaje =
      r.tipo === 'infinitas' && !sinSolucion
        ? `Ese número sí cumple la ecuación, pero no es el único: aquí la ${l} se cancela y cualquier número sirve.`
        : `Fíjate en lo que pasa con la ${l}: en algún momento se cancela. Revisa qué queda al final.`
    return { estado: 'incorrecto', mensaje, errorId: null, ...(paso === undefined ? {} : { paso }) }
  }
  if (r.tipo !== 'solucion') return { estado: 'invalido', mensaje: 'No pude revisar esta respuesta.' }

  if (sinSolucion || infinitas) {
    return { estado: 'incorrecto', mensaje: `Esta ecuación sí tiene una sola solución: hay un número que, en lugar de la ${l}, hace que los dos lados den lo mismo.`, errorId: null }
  }
  // "x = 3" o solo "3".
  const limpio = texto.replace(new RegExp(`^${l}\\s*=\\s*`, 'i'), '')
  const lectura = leerRespuesta(limpio)
  if (!lectura.ok) return { estado: 'invalido', mensaje: lectura.mensaje }
  const v = lectura.valor
  if (v.equals(r.valor)) {
    if (!r.valor.isInteger() && !lectura.simplificada) {
      return { estado: 'casi', mensaje: 'El valor está bien, pero todavía se puede simplificar. Divide arriba y abajo entre el mismo número.' }
    }
    return { estado: 'correcto', mensaje: `Correcto: con ${l} = ${numero(r.valor)} los dos lados dan lo mismo.` }
  }
  const error = erroresPosibles(p.ast).find((e) => e.valor.equals(v))
  if (error) {
    const paso = indiceDe(sol, ERRORES[error.id].regla)
    return { estado: 'incorrecto', mensaje: ERRORES[error.id].mensaje, errorId: error.id, ...(paso === undefined ? {} : { paso }) }
  }
  if (!r.valor.isZero() && v.equals(r.valor.neg())) {
    return { estado: 'incorrecto', mensaje: 'El número está bien, pero revisa el signo.', errorId: 'signo' }
  }
  return {
    estado: 'incorrecto',
    mensaje: `Todavía no. Puedes comprobarlo tú: pon tu número en lugar de la ${l} en la ecuación. Si los dos lados no dan lo mismo, hay un error en algún paso.`,
    errorId: null,
  }
}

/** ¿Un resultado con números cómodos? */
function sencillo(s: Solucion): boolean {
  const r = s.resultado
  if (r.tipo !== 'solucion') return true
  return Math.abs(r.valor.num) <= 99 && r.valor.den <= 12
}

export function parecidoEcuacion(p: ProblemaEcuacion, semilla: number): ProblemaEcuacion | null {
  const original = resolverEcuacion(p.ast).resultado.tipo
  const r = crearRng(semilla)
  const antes = latexDe(p.ast)
  for (let k = 0; k < 150; k++) {
    const nuevo = cambiarNumeros(p.ast, r)
    if (nuevo.tipo !== 'igual' || latexDe(nuevo) === antes) continue
    const q = detectarEcuacion(nuevo)
    if (!q) continue
    try {
      const s = resolverEcuacion(q.ast)
      if (s.resultado.tipo === original && sencillo(s) && comprobarEcuacion(q, s)) return q
    } catch {
      // Ese no sirve: se prueba otro.
    }
  }
  return null
}

export const motor: Motor<ProblemaEcuacion> = {
  id: 'ecuacion-lineal',
  prioridad: 20,
  detectar: detectarEcuacion,
  resolver: (p) => resolverEcuacion(p.ast),
  comprobar: comprobarEcuacion,
  revisar: revisarEcuacion,
  parecido: parecidoEcuacion,
  expresion: (p) => p.ast,
}
