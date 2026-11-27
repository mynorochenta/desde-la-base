import type { FormaProducto, Nodo } from './ast'

/**
 * Atajos para armar árboles a mano con ids elegidos. Los usan los motores
 * para conservar el id de un término de un paso al siguiente.
 */
export const num = (id: string, valor: number): Nodo => ({ tipo: 'num', id, valor })
export const letra = (id: string, nombre: string): Nodo => ({ tipo: 'var', id, nombre })
export const neg = (id: string, arg: Nodo): Nodo => ({ tipo: 'neg', id, arg })
export const suma = (id: string, izq: Nodo, der: Nodo): Nodo => ({ tipo: 'suma', id, izq, der })
export const resta = (id: string, izq: Nodo, der: Nodo): Nodo => ({ tipo: 'resta', id, izq, der })
export const producto = (id: string, izq: Nodo, der: Nodo, forma: FormaProducto = 'punto'): Nodo => ({
  tipo: 'producto',
  id,
  izq,
  der,
  forma,
})
export const division = (id: string, izq: Nodo, der: Nodo): Nodo => ({ tipo: 'division', id, izq, der })
export const frac = (id: string, n: Nodo, d: Nodo): Nodo => ({ tipo: 'frac', id, num: n, den: d })
export const pot = (id: string, base: Nodo, exp: Nodo): Nodo => ({ tipo: 'pot', id, base, exp })
export const par = (id: string, arg: Nodo): Nodo => ({ tipo: 'par', id, arg })
export const igual = (id: string, izq: Nodo, der: Nodo): Nodo => ({ tipo: 'igual', id, izq, der })
