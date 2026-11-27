/**
 * Tokens de movimiento: espejo de --dur-* y --curva-* en styles/tokens.css.
 * Ninguna animación nueva escribe una duración a mano: usa estos valores.
 */

/** Duraciones en segundos (Motion y GSAP usan segundos). */
export const dur = {
  rapida: 0.15,
  media: 0.3,
  lenta: 0.6,
  /** Tiempo para leer un momento de un paso antes de pasar al siguiente. */
  pausa: 1.1,
} as const

/** Curvas como bezier, para Motion. */
export const curva = {
  entrada: [0.22, 1, 0.36, 1],
  salida: [0.55, 0, 1, 0.45],
  rebote: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

/** Las mismas curvas con nombres de GSAP (lo más cercano sin plugins). */
export const curvaGsap = {
  entrada: 'expo.out',
  salida: 'power3.in',
  rebote: 'back.out(1.7)',
} as const
