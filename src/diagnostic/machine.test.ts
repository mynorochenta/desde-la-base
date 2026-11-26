import { describe, expect, it } from 'vitest'
import { conceptoMeta, conceptos, type ConceptoId } from '../content/concepts'
import { ancestros, ordenTopologico } from '../content/grafo'
import {
  MAX_PREGUNTAS,
  estadosMapa,
  iniciar,
  responder,
  rutaRecomendada,
  terminado,
  veredictos,
} from './machine'

const ids = ordenTopologico()

/**
 * Todos los "estudiantes posibles": conjuntos de conceptos que alguien sabe,
 * donde si sabe algo también sabe sus prerrequisitos.
 */
function perfilesPosibles(): Set<ConceptoId>[] {
  const perfiles: Set<ConceptoId>[] = []
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const sabe = new Set(ids.filter((_, i) => mask & (1 << i)))
    const cerrado = [...sabe].every((id) => [...ancestros(id)].every((a) => sabe.has(a)))
    if (cerrado) perfiles.push(sabe)
  }
  return perfiles
}

/** Corre el diagnóstico con alguien que responde bien solo lo que sabe. */
function simular(sabe: Set<ConceptoId>) {
  let e = iniciar()
  let vueltas = 0
  while (!terminado(e)) {
    e = responder(e, { tipo: 't', semilla: vueltas, correcto: sabe.has(e.actual!) })
    if (++vueltas > 50) throw new Error('El diagnóstico no termina')
  }
  return e
}

describe('diagnóstico adaptativo', () => {
  const perfiles = perfilesPosibles()

  it('hay varios perfiles para probar', () => {
    expect(perfiles.length).toBeGreaterThan(10)
  })

  it('empieza por el concepto más alto', () => {
    expect(iniciar().actual).toBe(conceptoMeta)
  })

  it('hace 2 preguntas antes de decidir', () => {
    const e = responder(iniciar(), { tipo: 't', semilla: 1, correcto: true })
    expect(e.actual).toBe(conceptoMeta)
    expect(e.resultados[conceptoMeta]).toBeUndefined()
  })

  it('si domina lo más alto, termina en 2 preguntas con todo dominado', () => {
    const e = simular(new Set(ids))
    expect(e.historial).toHaveLength(2)
    expect(Object.values(veredictos(e)).every((v) => v === 'dominado')).toBe(true)
    expect(rutaRecomendada(veredictos(e))).toEqual([])
  })

  for (const sabe of perfilesPosibles()) {
    const nombre = sabe.size ? [...sabe].join(', ') : 'nada'
    it(`perfil que sabe: ${nombre}`, () => {
      const e = simular(sabe)
      const v = veredictos(e)

      // Nunca pasa del máximo de preguntas.
      expect(e.historial.length).toBeLessThanOrEqual(MAX_PREGUNTAS)

      // Nunca se equivoca: lo que marca dominado lo sabe, y lo que marca no dominado no lo sabe.
      for (const id of ids) {
        if (v[id] === 'dominado') expect(sabe.has(id)).toBe(true)
        if (v[id] === 'no-dominado') expect(sabe.has(id)).toBe(false)
      }

      // La ruta empieza en algo que de verdad le falta y para lo que ya tiene la base.
      const ruta = rutaRecomendada(v)
      if (sabe.size < ids.length) {
        const primero = ruta[0]
        expect(sabe.has(primero)).toBe(false)
        for (const p of conceptos[primero].prerrequisitos) expect(sabe.has(p)).toBe(true)
      }
    })
  }

  it('en promedio usa pocas preguntas', () => {
    const total = perfiles.reduce((s, p) => s + simular(p).historial.length, 0)
    expect(total / perfiles.length).toBeLessThanOrEqual(10)
  })
})

describe('estados del mapa', () => {
  it('marca dominado, siguiente y bloqueado', () => {
    const m = estadosMapa({ enteros: 'dominado', signos: 'no-dominado' })
    expect(m.enteros).toBe('dominado')
    expect(m.signos).toBe('siguiente')
    expect(m.jerarquia).toBe('bloqueado')
    expect(m['ecuaciones-lineales']).toBe('bloqueado')
  })

  it('la ruta respeta el orden de prerrequisitos', () => {
    const ruta = rutaRecomendada({ enteros: 'dominado' })
    expect(ruta[0]).toBe('signos')
    expect(ruta).not.toContain('enteros')
    expect(ruta.at(-1)).toBe(conceptoMeta)
  })
})
