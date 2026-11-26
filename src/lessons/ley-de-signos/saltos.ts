/**
 * Modelo de la recta numérica de la lección: una operación es una fila de
 * saltos que salen desde un punto. Un signo menos "voltea" los saltos.
 *
 *   a + b       → desde a, un salto de b
 *   a - b       → desde a, un salto de b, volteado
 *   a · b       → desde 0, |b| saltos de a; volteados si b es negativo
 */
export type Saltos = {
  inicio: number
  /** Tamaño con signo de cada salto, tal como se dibuja antes de voltear. */
  saltos: number[]
  voltear: boolean
}

export const suma = (a: number, b: number): Saltos => ({ inicio: a, saltos: [b], voltear: false })
export const resta = (a: number, b: number): Saltos => ({ inicio: a, saltos: [b], voltear: true })
export const producto = (a: number, veces: number): Saltos => ({
  inicio: 0,
  saltos: Array.from({ length: Math.abs(veces) }, () => a),
  voltear: veces < 0,
})

/** Dónde cae cada salto, en orden. `s` va de 1 (sin voltear) a -1 (volteado). */
export function puntos(m: Saltos, s = m.voltear ? -1 : 1): number[] {
  const r = [m.inicio]
  let x = m.inicio
  for (const t of m.saltos) {
    x += s * t
    r.push(x)
  }
  return r
}

export function final(m: Saltos): number {
  return puntos(m).at(-1)!
}

/** Rango de la recta que muestra todo el recorrido, con margen y al menos `minimo` de ancho. */
export function rangoPara(m: Saltos, minimo = 10): [number, number] {
  const todos = [0, ...puntos(m, 1), ...puntos(m, -1)]
  // Margen proporcional: en rectas largas los números de las orillas ocupan más.
  const margen = Math.max(1, Math.ceil((Math.max(...todos) - Math.min(...todos)) * 0.08))
  let lo = Math.min(...todos) - margen
  let hi = Math.max(...todos) + margen
  const falta = minimo - (hi - lo)
  if (falta > 0) {
    lo -= Math.floor(falta / 2)
    hi += Math.ceil(falta / 2)
  }
  return [lo, hi]
}

/** Qué caso de la ley de signos es, para marcar los que ya probaste. */
export type CasoSuma = 'suma-positivo' | 'suma-negativo' | 'resta-positivo' | 'resta-negativo'
export type CasoProducto = '++' | '+-' | '-+' | '--'

export const casoSuma = (op: 'sumar' | 'restar', b: number): CasoSuma =>
  `${op === 'sumar' ? 'suma' : 'resta'}-${b > 0 ? 'positivo' : 'negativo'}`

export const casoProducto = (a: number, b: number): CasoProducto =>
  `${a > 0 ? '+' : '-'}${b > 0 ? '+' : '-'}` as CasoProducto

const n = (x: number) => (x < 0 ? `−${-x}` : `${x}`)

/** Lo que se ve en la recta, en palabras, para lectores de pantalla. */
export function describir(m: Saltos): string {
  const uno = m.saltos.length === 1
  const saltos = uno ? `das un salto de ${n(m.saltos[0])}` : `das ${m.saltos.length} saltos de ${n(m.saltos[0])}`
  const volteo = m.voltear ? (uno ? ' y el signo menos lo voltea' : ' y el signo menos los voltea') : ''
  return `En la recta: desde ${n(m.inicio)} ${saltos}${volteo}. Llegas a ${n(final(m))}.`
}
