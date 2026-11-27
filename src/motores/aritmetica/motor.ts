import { armar } from '../../engine/ejercicio'
import { leerRespuesta } from '../../engine/parse'
import type { Ejercicio } from '../../engine/types'
import { verificar } from '../../engine/verify'
import { recorrer, variables, type Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'
import { latexDe } from '../../expr/tokens'
import type { Motor, Revision, Solucion } from '../tipos'
import { ERRORES, erroresPosibles } from './errores'
import { resolverAritmetica, type SolucionAritmetica } from './pasos'
import { parecidoAritmetica } from './parecido'

/**
 * Motor de aritmética: enteros, signos, fracciones, potencias y jerarquía de
 * operaciones. Sin letras ni signo =.
 */

export type ProblemaAritmetica = { ast: Nodo }

const NODOS_MAXIMOS = 80

export function detectarAritmetica(ast: Nodo): ProblemaAritmetica | null {
  if (ast.tipo === 'igual' || variables(ast).length > 0) return null
  const nodos = [...recorrer(ast)]
  if (nodos.length > NODOS_MAXIMOS) return null
  const v = evaluar(ast)
  // Una división entre cero sí es nuestra: la respuesta es "no está definido".
  if (!v.ok && v.motivo !== 'division-cero' && v.motivo !== 'cero-a-la-cero') return null
  // Exponentes: solo enteros pequeños.
  for (const n of nodos) {
    if (n.tipo !== 'pot') continue
    const e = evaluar(n.exp)
    if (e.ok && (!e.valor.isInteger() || Math.abs(e.valor.num) > 12)) return null
  }
  return { ast }
}

/** Comprobación independiente: el evaluador calcula el valor por su lado. */
export function comprobarAritmetica(p: ProblemaAritmetica, s: Solucion): boolean {
  const v = evaluar(p.ast)
  if (s.resultado.tipo === 'no-definido') return !v.ok && (v.motivo === 'division-cero' || v.motivo === 'cero-a-la-cero')
  return s.resultado.tipo === 'valor' && v.ok && v.valor.equals(s.resultado.valor)
}

/**
 * El problema como ejercicio de la app: así "Practicar uno igual" usa el
 * mismo bloque de responder que Aprender, con los mismos errores típicos.
 */
export function ejercicioDe(ast: Nodo, semilla = 0): Ejercicio | null {
  const v = evaluar(ast)
  if (!v.ok) return null
  return armar('jerarquia', semilla, {
    tipo: 'aritmetica',
    enunciado: 'Resuelve.',
    latex: latexDe(ast),
    respuesta: v.valor,
    pedirSimplificada: !v.valor.isInteger(),
    pista: 'Revisa la solución paso a paso para ver dónde se separó tu camino.',
    errores: erroresPosibles(ast, v.valor).map((e) => ({ id: e.id, valor: e.valor, mensaje: e.mensaje })),
    datos: {},
  })
}

/** Índice del primer paso donde se ve la regla que el error rompió. */
export function pasoDelError(s: SolucionAritmetica, errorId: string | null): number | undefined {
  const e = ERRORES.find((x) => x.id === errorId)
  if (!e) return undefined
  const i = s.pasos.findIndex((p) => e.pasos.includes(p.regla))
  return i === -1 ? undefined : i
}

export function revisarAritmetica(p: ProblemaAritmetica, respuesta: string): Revision {
  const ej = ejercicioDe(p.ast)
  if (!ej) {
    // División entre cero: la respuesta correcta es que no está definido.
    return /no|indef/i.test(respuesta)
      ? { estado: 'correcto', mensaje: 'Correcto: no está definido, porque hay una división entre 0.' }
      : { estado: 'incorrecto', mensaje: 'Este problema no tiene resultado: en algún momento hay que dividir entre 0.', errorId: 'division-cero' }
  }
  if (/^\s*(no|indef)/i.test(respuesta)) {
    return { estado: 'incorrecto', mensaje: 'Este problema sí tiene resultado: en ningún momento se divide entre 0.', errorId: null }
  }
  const lectura = leerRespuesta(respuesta)
  if (!lectura.ok) return { estado: 'invalido', mensaje: lectura.mensaje }
  const r = verificar(ej, respuesta)
  if (r.estado !== 'incorrecto') return r
  const paso = pasoDelError(resolverAritmetica(p.ast), r.errorId)
  return { ...r, ...(paso === undefined ? {} : { paso }) }
}

export const motor: Motor<ProblemaAritmetica> = {
  id: 'aritmetica',
  prioridad: 10,
  detectar: detectarAritmetica,
  resolver: (p) => resolverAritmetica(p.ast),
  comprobar: comprobarAritmetica,
  revisar: revisarAritmetica,
  parecido: (p, semilla) => {
    const ast = parecidoAritmetica(p.ast, semilla, (n) => {
      try {
        return comprobarAritmetica({ ast: n }, resolverAritmetica(n))
      } catch {
        return false
      }
    })
    return ast ? { ast } : null
  },
  expresion: (p) => p.ast,
}
