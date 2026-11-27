import { describe, expect, it } from 'vitest'
import { leerUbicacion, rutas, seccionDe } from './router'

describe('router', () => {
  it('separa camino y parámetros', () => {
    const u = leerUbicacion('#/resolver?p=2%2B3&tema=signos,enteros')
    expect(u.camino).toBe('/resolver')
    expect(u.params.get('p')).toBe('2+3')
    expect(u.params.get('tema')).toBe('signos,enteros')
  })
  it('sin hash es el inicio', () => {
    expect(leerUbicacion('').camino).toBe('/')
    expect(leerUbicacion('#').camino).toBe('/')
    expect(leerUbicacion('#?p=1').camino).toBe('/')
  })
  it('ida y vuelta: el problema llega igual', () => {
    for (const p of ['3/4 + 5/6', '\\frac{1}{2}\\cdot\\left(-4\\right)', '2x − 1 = 8x + 11', '<script>&?=#%']) {
      const u = leerUbicacion(`#${rutas.resolver(p, ['signos'])}`)
      expect(u.params.get('p')).toBe(p)
      expect(u.params.get('tema')).toBe('signos')
    }
  })
  it('un % suelto no rompe la lectura', () => {
    expect(() => leerUbicacion('#/resolver?p=%E0%A4%A')).not.toThrow()
  })
  it('marca la sección correcta', () => {
    expect(seccionDe('/')).toBe('resolver')
    expect(seccionDe('/resolver')).toBe('resolver')
    expect(seccionDe('/aprender')).toBe('aprender')
    expect(seccionDe('/leccion/ley-de-signos')).toBe('aprender')
  })
})
