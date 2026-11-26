import { describe, expect, it } from 'vitest'
import { armar } from './ejercicio'
import { f } from './fraction'
import { verificar } from './verify'

const sumaFracciones = armar('fracciones-suma', 1, {
  tipo: 'distintoDenominador',
  enunciado: 'Resuelve.',
  latex: '\\frac12 + \\frac13',
  respuesta: f(5, 6),
  pedirSimplificada: true,
  pista: 'Busca denominador común.',
  errores: [{ id: 'suma-denominadores', valor: f(2, 5), mensaje: 'No se suman los de abajo.' }],
  datos: {},
})

const resta = armar('signos', 1, {
  tipo: 'restaNegativo',
  enunciado: 'Resuelve.',
  latex: '3 - (-5)',
  respuesta: f(8),
  pista: 'Restar un negativo es sumar.',
  errores: [{ id: 'resta-negativo', valor: f(-2), mensaje: 'Restar un negativo es sumar.' }],
  datos: {},
})

describe('verificar', () => {
  it('acepta la respuesta correcta en distintas formas', () => {
    expect(verificar(sumaFracciones, '5/6').estado).toBe('correcto')
    expect(verificar(resta, '8').estado).toBe('correcto')
    expect(verificar(resta, '+8').estado).toBe('correcto')
    expect(verificar(resta, '8/1').estado).toBe('correcto') // no pide simplificar
  })

  it('marca "casi" si falta simplificar', () => {
    const r = verificar(sumaFracciones, '10/12')
    expect(r.estado).toBe('casi')
  })

  it('reconoce el error de sumar denominadores', () => {
    const r = verificar(sumaFracciones, '2/5')
    expect(r).toMatchObject({ estado: 'incorrecto', errorId: 'suma-denominadores' })
  })

  it('reconoce el error aunque no esté simplificado', () => {
    expect(verificar(sumaFracciones, '4/10')).toMatchObject({ errorId: 'suma-denominadores' })
  })

  it('dice "revisa el signo" con el signo cambiado', () => {
    const r = verificar(resta, '-8')
    expect(r).toMatchObject({ estado: 'incorrecto', errorId: 'signo' })
    expect(r.mensaje).toMatch(/signo/)
  })

  it('detecta la fracción volteada', () => {
    expect(verificar(sumaFracciones, '6/5')).toMatchObject({ errorId: 'volteada' })
    expect(verificar(sumaFracciones, '-6/5')).toMatchObject({ errorId: 'volteada-signo' })
  })

  it('usa el error propio del ejercicio', () => {
    expect(verificar(resta, '-2')).toMatchObject({ errorId: 'resta-negativo' })
  })

  it('da la pista si no reconoce el error', () => {
    const r = verificar(resta, '100')
    expect(r).toMatchObject({ estado: 'incorrecto', errorId: null })
    expect(r.mensaje).toContain('Restar un negativo')
  })

  it('no cuenta como intento lo que no se puede leer', () => {
    expect(verificar(resta, 'ocho').estado).toBe('invalido')
    expect(verificar(resta, '').estado).toBe('invalido')
  })
})

describe('armar', () => {
  it('quita errores que coinciden con la respuesta, repetidos o nulos', () => {
    const ej = armar('x', 1, {
      tipo: 't',
      enunciado: '',
      latex: '',
      respuesta: f(4),
      pista: '',
      errores: [
        { id: 'igual', valor: f(4), mensaje: '' },
        { id: 'a', valor: f(5), mensaje: '' },
        { id: 'b', valor: f(10, 2), mensaje: '' },
        { id: 'nulo', valor: null, mensaje: '' },
      ],
      datos: {},
    })
    expect(ej.errores.map((e) => e.id)).toEqual(['a'])
  })
})
