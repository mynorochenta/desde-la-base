import { describe, expect, it } from 'vitest'
import { f } from '../engine/fraction'
import type { Nodo } from '../expr/ast'
import { leerProblema } from '../expr/parse'
import { temaCercano } from './cercano'
import { despachar, motores } from './registro'
import type { Motor, Solucion } from './tipos'

const ast = (s: string): Nodo => {
  const r = leerProblema(s)
  if (!r.ok) throw new Error(r.error.mensaje)
  return r.ast
}

/** Motor de prueba: reconoce "a + b" con dos números y devuelve lo que le digamos. */
function motorDePrueba(id: string, prioridad: number, solucion: (a: Nodo) => Solucion, comprobar = true): Motor<Nodo> {
  return {
    id,
    prioridad,
    detectar: (a) => (a.tipo === 'suma' ? a : null),
    resolver: solucion,
    comprobar: () => comprobar,
    revisar: () => ({ estado: 'invalido', mensaje: '' }),
    parecido: (p) => p,
    expresion: (p) => p,
  }
}

const bien = (a: Nodo): Solucion => ({
  pasos: [{ titulo: 'Suma', explicacion: '', frames: [{ expr: a }, { expr: { tipo: 'num', id: 'r', valor: 5 } }], conceptos: ['enteros'] }],
  resultado: { tipo: 'valor', valor: f(5) },
})

describe('despachar', () => {
  it('el registro encuentra el motor de aritmética', () => {
    expect(motores.map((m) => m.id)).toEqual(['aritmetica'])
    expect(despachar(ast('2 + 3')).estado).toBe('resuelto')
    expect(despachar(ast('2x + 1')).estado).toBe('no-reconocido')
  })

  it('usa el primer motor en orden de prioridad', () => {
    const a = motorDePrueba('a', 2, bien)
    const b = motorDePrueba('b', 1, bien)
    const lista = [b, a]
    const r = despachar(ast('2 + 3'), lista)
    expect(r.estado === 'resuelto' && r.motor.id).toBe('b')
  })

  it('no reconoce lo que ningún motor detecta', () => {
    expect(despachar(ast('2 · 3'), [motorDePrueba('a', 1, bien) as Motor<unknown>]).estado).toBe('no-reconocido')
  })

  it('no muestra un resultado que no pasa la comprobación del motor', () => {
    const r = despachar(ast('2 + 3'), [motorDePrueba('a', 1, bien, false) as Motor<unknown>])
    expect(r.estado).toBe('no-verificado')
  })

  it('no muestra un resultado si un paso cambia el valor', () => {
    const malo = (a: Nodo): Solucion => ({
      pasos: [{ titulo: 'Suma', explicacion: '', frames: [{ expr: a }, { expr: { tipo: 'num', id: 'r', valor: 6 } }], conceptos: [] }],
      resultado: { tipo: 'valor', valor: f(5) },
    })
    expect(despachar(ast('2 + 3'), [motorDePrueba('a', 1, malo) as Motor<unknown>]).estado).toBe('no-verificado')
  })

  it('si el motor falla, no muestra nada a medias', () => {
    const roto = () => {
      throw new Error('roto')
    }
    expect(despachar(ast('2 + 3'), [motorDePrueba('a', 1, roto) as Motor<unknown>]).estado).toBe('no-verificado')
  })
})

describe('temaCercano', () => {
  it.each([
    ['2x + 1 = 5', 'ecuaciones-lineales'],
    ['x^2', 'ecuaciones-lineales'],
    ['2^3 + 1', 'potencias'],
    ['3/4 + 1/2', 'fracciones-suma'],
    ['3/4 · 1/2', 'fracciones-multiplicacion'],
    ['2 + 3 · 4', 'jerarquia'],
    ['-3 + 5', 'signos'],
    ['3 + 5', 'enteros'],
  ])('%s → %s', (s, tema) => {
    expect(temaCercano(ast(s))).toBe(tema)
  })
})
