import { describe, expect, it } from 'vitest'
import { leerRespuesta } from './parse'

const valor = (s: string) => {
  const r = leerRespuesta(s)
  if (!r.ok) throw new Error(`No se leyó "${s}": ${r.mensaje}`)
  return r
}

describe('leerRespuesta', () => {
  it.each([
    ['5', '5'],
    ['-3', '-3'],
    ['+2', '2'],
    ['  7 ', '7'],
    ['−4', '-4'], // signo menos tipográfico
    ['– 4', '-4'],
    ['3/4', '3/4'],
    ['-3/4', '-3/4'],
    ['3/-4', '-3/4'],
    ['-3/-4', '3/4'],
    ['3 / 4', '3/4'],
    ['6/8', '3/4'],
    ['1 1/2', '3/2'],
    ['-1 1/2', '-3/2'],
    ['0.5', '1/2'],
    ['0,25', '1/4'],
    ['-.75', '-3/4'],
    ['0', '0'],
  ])('lee %s como %s', (entrada, esperado) => {
    expect(valor(entrada).valor.toString()).toBe(esperado)
  })

  it('sabe si la escribiste simplificada', () => {
    expect(valor('2/3').simplificada).toBe(true)
    expect(valor('4/6').simplificada).toBe(false)
    expect(valor('4/2').simplificada).toBe(false)
    expect(valor('5/1').simplificada).toBe(false)
    expect(valor('5').simplificada).toBe(true)
    expect(valor('1 1/2').simplificada).toBe(true)
    expect(valor('1 2/4').simplificada).toBe(false)
  })

  it('explica cuando no entiende', () => {
    for (const s of ['', '   ', 'x=3', 'tres', '3/0', '1/2/3', '--3']) {
      const r = leerRespuesta(s)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.mensaje.length).toBeGreaterThan(5)
    }
  })
})
