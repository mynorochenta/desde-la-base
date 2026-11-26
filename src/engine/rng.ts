/**
 * Números aleatorios con semilla (mulberry32). La misma semilla da siempre
 * el mismo ejercicio: así un reporte de error se puede reproducir exacto.
 */
export type Rng = {
  /** Decimal en [0, 1). */
  next(): number
  /** Entero entre min y max, ambos incluidos. */
  int(min: number, max: number): number
  /** Entero entre min y max, sin el cero. */
  nonZero(min: number, max: number): number
  pick<T>(opciones: readonly T[]): T
  bool(probabilidad?: number): boolean
  /** -1 o 1. */
  signo(): 1 | -1
}

export function crearRng(semilla: number): Rng {
  let a = semilla >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    int,
    nonZero(min, max) {
      if (min === 0 && max === 0) throw new RangeError('Rango sin valores distintos de cero')
      for (;;) {
        const n = int(min, max)
        if (n !== 0) return n
      }
    },
    pick: (opciones) => opciones[int(0, opciones.length - 1)],
    bool: (p = 0.5) => next() < p,
    signo: () => (next() < 0.5 ? -1 : 1),
  }
}

export function semillaNueva(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
