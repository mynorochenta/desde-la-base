import type { ConceptoId } from './concepts'

/**
 * Dónde se dibuja cada concepto en el mapa (lienzo de 340 × 540).
 * La base queda abajo y lo más avanzado arriba: se construye desde la base.
 * Al agregar un concepto, agrégale su posición aquí.
 */
export const ANCHO_MAPA = 340
export const ALTO_MAPA = 540

export const posiciones: Record<ConceptoId, { x: number; y: number }> = {
  'ecuaciones-lineales': { x: 170, y: 48 },
  potencias: { x: 255, y: 140 },
  'fracciones-suma': { x: 85, y: 230 },
  'fracciones-multiplicacion': { x: 255, y: 230 },
  jerarquia: { x: 85, y: 320 },
  'fracciones-simplificar': { x: 255, y: 320 },
  signos: { x: 170, y: 410 },
  enteros: { x: 170, y: 495 },
}
