/**
 * Árbol de una expresión (AST). Lo produce el parser y lo usan todos los motores.
 * Cada nodo tiene un `id` estable: es la clave con la que su token se anima
 * de un paso al siguiente (ver CLAUDE.md, FLIP).
 */

/** Cómo se escribió una multiplicación: 2·3, 2×3 o 2x (sin signo). */
export type FormaProducto = 'punto' | 'cruz' | 'implicita'

export type Nodo =
  /** Entero sin signo: 0, 7, 120. El signo menos es un nodo `neg`. */
  | { tipo: 'num'; id: string; valor: number }
  /** Una letra: x, y, a. */
  | { tipo: 'var'; id: string; nombre: string }
  /** Menos delante de algo: −3, −(2 + x). */
  | { tipo: 'neg'; id: string; arg: Nodo }
  | { tipo: 'suma'; id: string; izq: Nodo; der: Nodo }
  | { tipo: 'resta'; id: string; izq: Nodo; der: Nodo }
  | { tipo: 'producto'; id: string; izq: Nodo; der: Nodo; forma: FormaProducto }
  /** División escrita con ÷ o con dos puntos. */
  | { tipo: 'division'; id: string; izq: Nodo; der: Nodo }
  /** División escrita con raya de fracción: 3/4, \frac{x}{2}. */
  | { tipo: 'frac'; id: string; num: Nodo; den: Nodo }
  | { tipo: 'pot'; id: string; base: Nodo; exp: Nodo }
  /** Paréntesis que escribió la persona. Se conservan para mostrarlos y para los pasos. */
  | { tipo: 'par'; id: string; arg: Nodo }
  /** Número mixto, solo si se escribió de forma explícita (\mixto{1}{1}{2} = 1 ½). */
  | { tipo: 'mixto'; id: string; entero: number; num: number; den: number }
  /** Una igualdad: solo puede estar arriba de todo. */
  | { tipo: 'igual'; id: string; izq: Nodo; der: Nodo }

export type TipoNodo = Nodo['tipo']

/** Los hijos de un nodo, en orden de lectura. */
export function hijos(n: Nodo): Nodo[] {
  switch (n.tipo) {
    case 'num':
    case 'var':
    case 'mixto':
      return []
    case 'neg':
    case 'par':
      return [n.arg]
    case 'frac':
      return [n.num, n.den]
    case 'pot':
      return [n.base, n.exp]
    default:
      return [n.izq, n.der]
  }
}

/** Recorre el árbol completo, padre antes que hijos. */
export function* recorrer(n: Nodo): Generator<Nodo> {
  yield n
  for (const h of hijos(n)) yield* recorrer(h)
}

/** Letras que aparecen, sin repetir y en orden. */
export function variables(n: Nodo): string[] {
  const vistas: string[] = []
  for (const m of recorrer(n)) if (m.tipo === 'var' && !vistas.includes(m.nombre)) vistas.push(m.nombre)
  return vistas
}

/** Quita los paréntesis de afuera: ((3)) → 3. */
export function sinParentesis(n: Nodo): Nodo {
  while (n.tipo === 'par') n = n.arg
  return n
}
