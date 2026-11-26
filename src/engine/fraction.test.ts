import { describe, expect, it } from 'vitest'
import { Fraction, f, mcd } from './fraction'

describe('Fraction', () => {
  it('simplifica y deja el signo arriba', () => {
    expect(f(4, 6).toString()).toBe('2/3')
    expect(f(3, -4).toString()).toBe('-3/4')
    expect(f(-3, -4).toString()).toBe('3/4')
    expect(f(10, 5).toString()).toBe('2')
  })

  it('no deja -0', () => {
    expect(Object.is(f(0, -5).num, 0)).toBe(true)
    expect(f(0, 7).den).toBe(1)
  })

  it('rechaza denominador cero y no enteros', () => {
    expect(() => f(1, 0)).toThrow()
    expect(() => f(0.5, 1)).toThrow()
  })

  it('opera exacto', () => {
    expect(f(1, 3).add(f(1, 3)).add(f(1, 3)).equals(Fraction.uno)).toBe(true)
    expect(f(1, 2).add(f(1, 3)).toString()).toBe('5/6')
    expect(f(1, 2).sub(f(3, 4)).toString()).toBe('-1/4')
    expect(f(2, 3).mul(f(-3, 4)).toString()).toBe('-1/2')
    expect(f(2, 3).div(f(4, 9)).toString()).toBe('3/2')
    expect(() => f(1).div(Fraction.cero)).toThrow()
  })

  it('potencias', () => {
    expect(f(-2).pow(3).toString()).toBe('-8')
    expect(f(2, 3).pow(2).toString()).toBe('4/9')
    expect(f(5).pow(0).toString()).toBe('1')
    expect(f(2).pow(-2).toString()).toBe('1/4')
  })

  it('compara', () => {
    expect(f(1, 2).compare(f(2, 3))).toBe(-1)
    expect(f(-1, 2).compare(f(-2, 3))).toBe(1)
    expect(f(2, 4).compare(f(1, 2))).toBe(0)
  })

  it('mcd', () => {
    expect(mcd(12, 18)).toBe(6)
    expect(mcd(-12, 18)).toBe(6)
    expect(mcd(0, 5)).toBe(5)
  })
})
