import { describe, expect, it } from 'vitest'
import { leerTemas } from './temas'

describe('temas en la ruta', () => {
  it('lee la pila de temas en orden', () => {
    expect(leerTemas('signos,enteros')).toEqual(['signos', 'enteros'])
  })
  it('sin parámetro no hay hoja', () => {
    expect(leerTemas(null)).toEqual([])
    expect(leerTemas('')).toEqual([])
  })
  // El parámetro es texto no confiable: solo pasan ids de conceptos con mini lección.
  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', '<img src=x>', 'ecuaciones', 'signos;alert(1)'])(
    'descarta %s',
    (t) => {
      expect(leerTemas(t)).toEqual([])
    },
  )
  it('no repite temas', () => {
    expect(leerTemas('signos,enteros,signos')).toEqual(['signos', 'enteros'])
  })
  it('no deja una pila enorme', () => {
    expect(leerTemas(Array(50).fill('signos').join(',')).length).toBeLessThanOrEqual(8)
  })
})
