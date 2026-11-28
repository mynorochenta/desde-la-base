import { describe, expect, it } from 'vitest'
import { leerProblema } from '../../expr/parse'
import { motor } from '../../motores/aritmetica/motor'
import { texto } from '../../motores/aritmetica/numeros'
import { conceptos, type ConceptoId } from '../concepts'
import { generar } from '../generators'
import { minis } from '.'

const lista = Object.values(minis)

describe('mini lecciones', () => {
  it('cada una está guardada con el id de su concepto', () => {
    for (const [id, m] of Object.entries(minis)) expect(m.concepto).toBe(id)
  })

  it('hay mini lección para cada concepto de la aritmética y sus prerrequisitos', () => {
    const usados: ConceptoId[] = ['enteros', 'signos', 'jerarquia', 'fracciones-simplificar', 'fracciones-suma', 'fracciones-multiplicacion', 'potencias']
    for (const c of usados) {
      expect(minis[c]).toBeDefined()
      for (const p of conceptos[c].prerrequisitos) expect(minis[p]).toBeDefined()
    }
  })

  // Cada ejemplo lo resuelve el motor, y la explicación escrita a mano dice el mismo resultado.
  it.each(lista.flatMap((m) => m.ejemplos.map((e) => [m.concepto, e.problema, e.explicacion] as const)))(
    '%s: el ejemplo %s está bien explicado',
    (_c, problema, explicacion) => {
      const l = leerProblema(problema)
      expect(l.ok).toBe(true)
      if (!l.ok) return
      const p = motor.detectar(l.ast)
      expect(p).not.toBeNull()
      const s = motor.resolver(p!)
      expect(motor.comprobar(p!, s)).toBe(true)
      expect(s.resultado.tipo).toBe('valor')
      if (s.resultado.tipo !== 'valor') return
      const r = texto(s.resultado.valor)
      // El resultado aparece al final de la explicación (o justo antes de un comentario).
      expect(explicacion).toMatch(new RegExp(`(^|[^0-9/])${r.replace('/', '\\/')}([^0-9/]|$)`))
    },
  )

  it('cada concepto tiene ejercicios para probar', () => {
    for (const m of lista) {
      for (let s = 1; s <= 20; s++) expect(generar(m.concepto, s).respuesta).toBeDefined()
    }
  })
})
