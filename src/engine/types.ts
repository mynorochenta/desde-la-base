import type { Fraction } from './fraction'

/** Un error típico: si la respuesta da este valor, mostramos este mensaje. */
export type ErrorComun = {
  id: string
  valor: Fraction
  mensaje: string
}

/** Lo que una plantilla de ejercicio produce (sin semilla ni concepto). */
export type Borrador = {
  tipo: string
  /** Instrucción en lenguaje sencillo: "Resuelve.", "Encuentra x." */
  enunciado: string
  latex: string
  respuesta: Fraction
  /** Si es true, 4/6 cuenta como "casi" cuando la respuesta es 2/3. */
  pedirSimplificada?: boolean
  /** Lo que se muestra cuando la respuesta está mal y no reconocemos el error. */
  pista: string
  /** Errores posibles. Puede traer null si el cálculo del error no tiene sentido. */
  errores: Array<{ id: string; valor: Fraction | null; mensaje: string }>
  /** Los números usados, para pruebas y para reportes. */
  datos: Record<string, number>
}

export type Ejercicio = Omit<Borrador, 'errores' | 'pedirSimplificada'> & {
  concepto: string
  semilla: number
  pedirSimplificada: boolean
  errores: ErrorComun[]
}
