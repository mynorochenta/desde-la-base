/**
 * Mapa de conceptos: cada concepto dice qué necesitas saber antes.
 * Para agregar un tema (trigonometría, cálculo…): agrega su id al tipo,
 * su entrada aquí y sus generadores en ./generators.
 */
export type ConceptoId =
  | 'enteros'
  | 'signos'
  | 'jerarquia'
  | 'fracciones-simplificar'
  | 'fracciones-suma'
  | 'fracciones-multiplicacion'
  | 'potencias'
  | 'ecuaciones-lineales'

export type Concepto = {
  id: ConceptoId
  nombre: string
  /** Una frase para el mapa: qué aprendes aquí. */
  resumen: string
  prerrequisitos: ConceptoId[]
  /** id de la lección, si ya existe. */
  leccion?: string
}

export const conceptos: Record<ConceptoId, Concepto> = {
  enteros: {
    id: 'enteros',
    nombre: 'Números enteros',
    resumen: 'Positivos, negativos y la recta numérica.',
    prerrequisitos: [],
  },
  signos: {
    id: 'signos',
    nombre: 'Ley de signos',
    resumen: 'Sumar, restar, multiplicar y dividir con negativos.',
    prerrequisitos: ['enteros'],
    leccion: 'ley-de-signos',
  },
  jerarquia: {
    id: 'jerarquia',
    nombre: 'Orden de las operaciones',
    resumen: 'Qué se resuelve primero en una operación larga.',
    prerrequisitos: ['signos'],
  },
  'fracciones-simplificar': {
    id: 'fracciones-simplificar',
    nombre: 'Simplificar fracciones',
    resumen: 'Escribir una fracción con los números más pequeños posibles.',
    prerrequisitos: ['signos'],
  },
  'fracciones-suma': {
    id: 'fracciones-suma',
    nombre: 'Sumar y restar fracciones',
    resumen: 'Denominador común sin perderse.',
    prerrequisitos: ['fracciones-simplificar', 'jerarquia'],
  },
  'fracciones-multiplicacion': {
    id: 'fracciones-multiplicacion',
    nombre: 'Multiplicar y dividir fracciones',
    resumen: 'Multiplicar derecho y dividir volteando.',
    prerrequisitos: ['fracciones-simplificar'],
  },
  potencias: {
    id: 'potencias',
    nombre: 'Potencias y exponentes',
    resumen: 'Qué significa elevar y las leyes de los exponentes.',
    prerrequisitos: ['jerarquia', 'fracciones-multiplicacion'],
  },
  'ecuaciones-lineales': {
    id: 'ecuaciones-lineales',
    nombre: 'Ecuaciones lineales',
    resumen: 'Despejar x paso a paso.',
    prerrequisitos: ['potencias', 'fracciones-suma'],
  },
}

/** El concepto más alto del mapa: ahí empieza el diagnóstico. */
export const conceptoMeta: ConceptoId = 'ecuaciones-lineales'
