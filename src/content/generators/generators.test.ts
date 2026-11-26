import { describe, expect, it } from 'vitest'
import { conceptos, conceptoMeta, type ConceptoId } from '../concepts'
import { ancestros, ordenTopologico, validarGrafo } from '../grafo'
import { f } from '../../engine/fraction'
import { crearRng } from '../../engine/rng'
import { verificar } from '../../engine/verify'
import { generar, plantillas } from './index'

const SEMILLAS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1)
const ids = Object.keys(conceptos) as ConceptoId[]

describe('rng', () => {
  it('la misma semilla da la misma secuencia', () => {
    const a = crearRng(42)
    const b = crearRng(42)
    for (let i = 0; i < 50; i++) expect(a.int(-100, 100)).toBe(b.int(-100, 100))
  })

  it('int respeta los límites', () => {
    const r = crearRng(7)
    for (let i = 0; i < 2000; i++) {
      const n = r.int(-3, 3)
      expect(n).toBeGreaterThanOrEqual(-3)
      expect(n).toBeLessThanOrEqual(3)
    }
  })
})

describe('mapa de conceptos', () => {
  it('no tiene problemas', () => {
    expect(validarGrafo()).toEqual([])
  })

  it('el concepto meta depende de todos los demás', () => {
    expect(ancestros(conceptoMeta).size).toBe(ids.length - 1)
  })

  it('el orden pone cada prerrequisito antes', () => {
    const orden = ordenTopologico()
    for (const id of ids) {
      for (const p of conceptos[id].prerrequisitos) expect(orden.indexOf(p)).toBeLessThan(orden.indexOf(id))
    }
  })

  it('cada concepto tiene generadores', () => {
    for (const id of ids) expect(Object.keys(plantillas[id]).length).toBeGreaterThan(0)
  })
})

// Pruebas que valen para todas las plantillas de todos los conceptos.
for (const id of ids) {
  describe(`generadores de ${id}`, () => {
    for (const tipo of Object.keys(plantillas[id])) {
      it(`${tipo}: es reproducible, la respuesta pasa y cada error se reconoce`, () => {
        for (const s of SEMILLAS) {
          const ej = generar(id, s, tipo)
          expect(generar(id, s, tipo)).toEqual(ej)

          expect(ej.latex.length).toBeGreaterThan(0)
          expect(ej.latex).not.toMatch(/undefined|NaN|\+ -|- -/)
          expect(ej.enunciado).not.toMatch(/undefined|NaN/)

          expect(verificar(ej, ej.respuesta.toString()).estado).toBe('correcto')

          for (const e of ej.errores) {
            expect(e.valor.equals(ej.respuesta)).toBe(false)
            const r = verificar(ej, e.valor.toString())
            expect(r).toMatchObject({ estado: 'incorrecto', errorId: e.id })
          }
        }
      })
    }
  })
}

// Comprobaciones independientes: recalculamos la respuesta con los datos.
const datos = (id: ConceptoId, tipo: string) => SEMILLAS.map((s) => generar(id, s, tipo))

describe('las respuestas son matemáticamente correctas', () => {
  it('ecuaciones: al sustituir x se cumple la igualdad', () => {
    for (const tipo of ['unPaso', 'dosPasos', 'resultadoFraccion']) {
      for (const ej of datos('ecuaciones-lineales', tipo)) {
        const { a, b, c } = ej.datos
        expect(f(a).mul(ej.respuesta).add(f(b)).equals(f(c))).toBe(true)
      }
    }
    for (const ej of datos('ecuaciones-lineales', 'ambosLados')) {
      const { a, b, c, d } = ej.datos
      const x = ej.respuesta
      expect(f(a).mul(x).add(f(b)).equals(f(c).mul(x).add(f(d)))).toBe(true)
    }
  })

  it('fracciones con distinto denominador', () => {
    for (const ej of datos('fracciones-suma', 'distintoDenominador')) {
      const { a, b, c, d, resta } = ej.datos
      const esperado = resta ? f(a * d - c * b, b * d) : f(a * d + c * b, b * d)
      expect(ej.respuesta.equals(esperado)).toBe(true)
    }
  })

  it('jerarquía: multiplicación antes que suma', () => {
    for (const ej of datos('jerarquia', 'sumaProducto')) {
      const { a, b, c } = ej.datos
      expect(ej.respuesta.equals(f(a + b * c))).toBe(true)
    }
  })

  it('simplificar: la respuesta es la misma fracción, ya reducida', () => {
    for (const ej of datos('fracciones-simplificar', 'simplificar')) {
      const { num, den } = ej.datos
      expect(ej.respuesta.equals(f(num, den))).toBe(true)
      expect(ej.respuesta.den).toBeLessThan(den)
      expect(verificar(ej, `${num}/${den}`).estado).toBe('casi')
    }
  })

  it('división de signos es exacta', () => {
    for (const ej of datos('signos', 'division')) {
      const { dividendo, divisor } = ej.datos
      expect(Math.abs(dividendo % divisor)).toBe(0)
      expect(ej.respuesta.equals(f(dividendo / divisor))).toBe(true)
    }
  })
})

describe('errores comunes concretos', () => {
  it('1/2 + 1/3 respondido como 2/5 es "sumar denominadores"', () => {
    const ej = datos('fracciones-suma', 'distintoDenominador').find(
      (e) => !e.datos.resta && e.errores.some((x) => x.id === 'suma-denominadores'),
    )!
    const { a, b, c, d } = ej.datos
    expect(verificar(ej, `${a + c}/${b + d}`)).toMatchObject({ errorId: 'suma-denominadores' })
  })

  it('(-3)^2 respondido como -9 explica el signo dentro del paréntesis', () => {
    const ej = datos('potencias', 'baseNegativa').find((e) => e.datos.n === 2)!
    const r = verificar(ej, `${-(ej.datos.a ** 2)}`)
    expect(r).toMatchObject({ errorId: 'signo-potencia' })
  })
})
