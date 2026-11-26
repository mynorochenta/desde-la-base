import { describe, expect, it } from 'vitest'
import { verificar } from '../engine/verify'
import { progresoNuevo } from '../storage/schema'
import { EJEMPLOS, PASOS, TIPOS } from './ley-de-signos/contenido'
import { saltosDe, tanda } from './ley-de-signos/ejercicios'
import { casoProducto, casoSuma, describir, final, producto, puntos, rangoPara, resta, suma } from './ley-de-signos/saltos'
import { completarLeccion, dominados, guardarPaso } from './leccion'

describe('saltos en la recta', () => {
  it('suma, resta y producto llegan al resultado correcto', () => {
    for (let a = -6; a <= 6; a++) {
      for (let b = -6; b <= 6; b++) {
        if (b === 0) continue
        expect(final(suma(a, b))).toBe(a + b)
        expect(final(resta(a, b))).toBe(a - b)
        expect(final(producto(a, b))).toBe(a * b + 0)
      }
    }
  })

  it('el producto da tantos saltos como veces', () => {
    expect(puntos(producto(-3, 4))).toEqual([0, -3, -6, -9, -12])
    expect(puntos(producto(-3, -2))).toEqual([0, 3, 6])
  })

  it('el rango contiene todo el recorrido, antes y después de voltear', () => {
    const m = resta(5, 6)
    const [lo, hi] = rangoPara(m)
    for (const x of [...puntos(m, 1), ...puntos(m, -1), 0]) {
      expect(x).toBeGreaterThan(lo)
      expect(x).toBeLessThan(hi)
    }
    expect(hi - lo).toBeGreaterThanOrEqual(10)
  })

  it('nombra los cuatro casos', () => {
    expect(casoSuma('restar', -2)).toBe('resta-negativo')
    expect(casoProducto(-1, -5)).toBe('--')
  })
})

describe('ejemplos guiados', () => {
  it('cada pregunta tiene exactamente una opción correcta', () => {
    for (const e of EJEMPLOS) for (const p of e.pasos) if (p.pregunta) expect(p.pregunta.opciones.filter((o) => o.correcta)).toHaveLength(1)
  })

  it('la recta del ejemplo llega al resultado del cierre', () => {
    expect(final(EJEMPLOS[0].recta)).toBe(-4)
    expect(final(EJEMPLOS[1].recta)).toBe(24)
  })
})

describe('tandas de ejercicios', () => {
  it('son reproducibles, traen los cuatro tipos y no repiten tipo seguido', () => {
    for (let s = 1; s < 200; s++) {
      const t = tanda(6, s)
      expect(t.map((e) => e.semilla)).toEqual(tanda(6, s).map((e) => e.semilla))
      expect(t).toHaveLength(6)
      for (const tipo of TIPOS) expect(t.some((e) => e.tipo === tipo)).toBe(true)
      for (let i = 4; i < t.length; i++) expect(t[i].tipo).not.toBe(t[i - 1].tipo)
      for (const e of t) expect(verificar(e, e.respuesta.toString()).estado).toBe('correcto')
    }
  })

  it('las sumas y restas se pueden ver en la recta con el mismo resultado', () => {
    for (let s = 1; s < 200; s++) {
      for (const e of tanda(6, s)) {
        const m = saltosDe(e)
        if (e.tipo === 'sumaDistinto' || e.tipo === 'restaNegativo') expect(final(m!)).toBe(Number(e.respuesta.toString()))
        else expect(m).toBeNull()
      }
    }
  })
})

describe('avance de la lección', () => {
  it('guardar el paso solo avanza', () => {
    let p = guardarPaso(progresoNuevo(), 'ley-de-signos', 3, 1)
    p = guardarPaso(p, 'ley-de-signos', 1, 2)
    expect(p.lecciones['ley-de-signos']).toEqual({ paso: 3, completada: false, fecha: 2 })
  })

  it('completar marca el concepto y sus prerrequisitos, y dice qué se desbloqueó', () => {
    const { progreso, desbloqueados } = completarLeccion(progresoNuevo(), 'ley-de-signos', 'signos', PASOS.length, 5)
    expect(progreso.lecciones['ley-de-signos'].completada).toBe(true)
    expect(progreso.conceptos.signos).toEqual({ dominado: true, fuente: 'leccion', fecha: 5 })
    expect(progreso.conceptos.enteros.dominado).toBe(true)
    expect(dominados(progreso)).toEqual(new Set(['enteros', 'signos']))
    expect(desbloqueados.sort()).toEqual(['fracciones-simplificar', 'jerarquia'])
  })

  it('no anuncia como desbloqueado lo que ya estaba disponible', () => {
    const p = progresoNuevo()
    p.conceptos.signos = { dominado: true, fuente: 'diagnostico', fecha: 1 }
    p.conceptos.enteros = { dominado: true, fuente: 'diagnostico', fecha: 1 }
    expect(completarLeccion(p, 'ley-de-signos', 'signos', 5).desbloqueados).toEqual([])
    expect(completarLeccion(p, 'ley-de-signos', 'signos', 5).progreso.conceptos.enteros.fuente).toBe('diagnostico')
  })
})

describe('descripción para lectores de pantalla', () => {
  it('dice en palabras el recorrido', () => {
    expect(describir(resta(-7, -3))).toBe('En la recta: desde −7 das un salto de −3 y el signo menos lo voltea. Llegas a −4.')
    expect(describir(producto(2, 3))).toBe('En la recta: desde 0 das 3 saltos de 2. Llegas a 6.')
  })
})
