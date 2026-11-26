import { Fraction, mcd } from './fraction'

export type TipoRespuesta = 'entero' | 'fraccion' | 'mixto' | 'decimal'

export type Lectura =
  | {
      ok: true
      valor: Fraction
      tipo: TipoRespuesta
      /** true si la persona la escribió ya simplificada (4/6 → false, 2/3 → true). */
      simplificada: boolean
    }
  | { ok: false; mensaje: string }

const AYUDA = 'Escribe un número como 5, -3 o 3/4.'

/** Limpia lo que la gente escribe en el teléfono: signos raros, comas, espacios. */
export function normalizar(texto: string): string {
  return texto
    .trim()
    .replace(/[−–—‐]/g, '-')
    .replace(/[÷⁄∕]/g, '/')
    .replace(/,/g, '.')
    .replace(/\s*\/\s*/g, '/')
    .replace(/^([+-])\s+/, '$1')
    .replace(/\s+/g, ' ')
}

/**
 * Lee la respuesta de un estudiante y la convierte en fracción exacta.
 * Acepta: 5, -3, +2, 3/4, -3/4, 3/-4, 1 1/2, -1 1/2, 0.5, 0,25
 */
export function leerRespuesta(texto: string): Lectura {
  const s = normalizar(texto)
  if (s === '') return { ok: false, mensaje: 'Escribe una respuesta.' }

  let m = /^([+-]?)(\d{1,9})$/.exec(s)
  if (m) {
    const n = Number(m[2]) * (m[1] === '-' ? -1 : 1)
    return { ok: true, valor: Fraction.of(n), tipo: 'entero', simplificada: true }
  }

  m = /^([+-]?)(\d{1,9})\/([+-]?)(\d{1,9})$/.exec(s)
  if (m) {
    const num = Number(m[2])
    const den = Number(m[4])
    if (den === 0) return { ok: false, mensaje: 'Abajo de la fracción no puede ir un cero.' }
    const negativo = (m[1] === '-') !== (m[3] === '-')
    return {
      ok: true,
      valor: Fraction.of(negativo ? -num : num, den),
      tipo: 'fraccion',
      simplificada: den !== 1 && mcd(num, den) === 1,
    }
  }

  m = /^([+-]?)(\d{1,9}) (\d{1,9})\/(\d{1,9})$/.exec(s)
  if (m) {
    const ent = Number(m[2])
    const num = Number(m[3])
    const den = Number(m[4])
    if (den === 0) return { ok: false, mensaje: 'Abajo de la fracción no puede ir un cero.' }
    const total = Fraction.of(ent * den + num, den)
    return {
      ok: true,
      valor: m[1] === '-' ? total.neg() : total,
      tipo: 'mixto',
      simplificada: num < den && num > 0 && mcd(num, den) === 1,
    }
  }

  m = /^([+-]?)(\d{0,9})\.(\d{1,6})$/.exec(s)
  if (m) {
    const escala = 10 ** m[3].length
    const n = Number(m[2] || '0') * escala + Number(m[3])
    return {
      ok: true,
      valor: Fraction.of(m[1] === '-' ? -n : n, escala),
      tipo: 'decimal',
      simplificada: true,
    }
  }

  if (/[a-zA-Z]/.test(s)) return { ok: false, mensaje: `Escribe solo el número, sin letras. ${AYUDA}` }
  return { ok: false, mensaje: `No se entiende esa respuesta. ${AYUDA}` }
}
