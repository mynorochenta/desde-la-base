import type { ConceptoId } from '../content/concepts'
import type { Fraction } from '../engine/fraction'
import type { Nodo } from '../expr/ast'

/**
 * Contrato de un motor de Resolver. Cada tipo de problema tiene el suyo en
 * src/motores/<id>/motor.ts, que exporta `motor`. El registro los encuentra solo.
 */

/** Un momento de la animación de un paso. Guarda el AST, no solo el dibujo. */
export type Frame = {
  expr: Nodo
  /** ids de nodos que se pintan con resaltador. */
  resaltar?: string[]
  /** ids de nodos que salen tachados con la pluma roja. */
  tachar?: string[]
}

/** Dibujo opcional de un paso. */
export type Visual =
  /** Recta numérica: se parte de `desde` y se da un salto por cada número de `saltos`. */
  | { tipo: 'recta'; desde: Fraction; saltos: Fraction[] }
  /** Balanza: lo que hay en cada platillo. */
  | { tipo: 'balanza'; izq: Nodo; der: Nodo }

export type Paso = {
  /** Qué se hace, corto: "Multiplica primero". */
  titulo: string
  /** El porqué, en una o dos frases. */
  explicacion: string
  /** Una nota opcional, por ejemplo el atajo "pasa con el signo contrario". */
  nota?: string
  /** Normalmente dos: antes y después. */
  frames: Frame[]
  /** Botones del árbol del porqué. */
  conceptos: ConceptoId[]
  visual?: Visual
}

export type Resultado =
  | { tipo: 'valor'; valor: Fraction }
  | { tipo: 'solucion'; variable: string; valor: Fraction }
  | { tipo: 'sin-solucion' }
  | { tipo: 'infinitas' }
  | { tipo: 'no-definido'; explicacion: string }

export type Solucion = { pasos: Paso[]; resultado: Resultado }

export type Revision =
  | { estado: 'correcto'; mensaje: string }
  | { estado: 'casi'; mensaje: string }
  /** `paso` es el índice del paso donde el camino del estudiante se separó, si se sabe. */
  | { estado: 'incorrecto'; mensaje: string; errorId: string | null; paso?: number }
  | { estado: 'invalido'; mensaje: string }

export type Motor<P> = {
  /** Igual al nombre de su carpeta: 'aritmetica', 'ecuacion-lineal'. */
  id: string
  /** El despachador prueba de menor a mayor. */
  prioridad: number
  /** ¿Este problema es mío? Por la forma del AST, no por el texto. */
  detectar(ast: Nodo): P | null
  resolver(p: P): Solucion
  /** Verificación independiente del resultado (por ejemplo, sustituir x). */
  comprobar(p: P, s: Solucion): boolean
  /** "Revisar mi respuesta": `respuesta` es lo que escribió el estudiante. */
  revisar(p: P, respuesta: string): Revision
  /** "Practicar uno igual": misma forma, otros números. */
  parecido(p: P, semilla: number): P
  /** El AST de un problema, para mostrarlo y para "practicar uno igual". */
  expresion(p: P): Nodo
}
