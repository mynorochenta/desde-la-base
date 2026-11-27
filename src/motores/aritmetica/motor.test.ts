import { describe, expect, it } from 'vitest'
import { conceptos } from '../../content/concepts'
import { f, type Fraction } from '../../engine/fraction'
import { crearRng, type Rng } from '../../engine/rng'
import { recorrer, type Nodo } from '../../expr/ast'
import { division, frac, neg, num, par, pot, producto, resta, suma } from '../../expr/construir'
import { evaluar } from '../../expr/evaluar'
import { leerProblema } from '../../expr/parse'
import { textoDe } from '../../expr/tokens'
import { despachar } from '../registro'
import { evaluarCon } from './errores'
import { comprobarAritmetica, detectarAritmetica, ejercicioDe, motor } from './motor'
import { Ids, nodoDe } from './numeros'

const ast = (s: string): Nodo => {
  const r = leerProblema(s)
  if (!r.ok) throw new Error(`${s}: ${r.error.mensaje}`)
  return r.ast
}

function resolver(s: string) {
  const p = detectarAritmetica(ast(s))
  if (!p) throw new Error(`${s} no se detectó`)
  const sol = motor.resolver(p)
  return { p, sol }
}

const valor = (s: string): Fraction => {
  const { sol } = resolver(s)
  if (sol.resultado.tipo !== 'valor') throw new Error(`${s}: ${sol.resultado.tipo}`)
  return sol.resultado.valor
}

/** Revisa todo lo que tiene que cumplir una solución. */
function revisarSolucion(n: Nodo) {
  const p = detectarAritmetica(n)
  expect(p).not.toBeNull()
  const sol = motor.resolver(p!)
  expect(comprobarAritmetica(p!, sol)).toBe(true)
  const v = evaluar(n)
  for (const paso of sol.pasos) {
    expect(paso.titulo.length).toBeGreaterThan(0)
    expect(paso.explicacion.length).toBeGreaterThan(10)
    expect(paso.conceptos.length).toBeGreaterThan(0)
    for (const c of paso.conceptos) expect(conceptos[c]).toBeDefined()
    // Cada frame vale lo mismo que el problema.
    if (v.ok) {
      for (const fr of paso.frames) {
        const w = evaluar(fr.expr)
        expect(w.ok && w.valor.equals(v.valor), `${textoDe(n)}: frame ${textoDe(fr.expr)}`).toBe(true)
      }
    }
    // El frame siguiente empieza donde terminó el anterior.
  }
  for (let i = 1; i < sol.pasos.length; i++) {
    expect(sol.pasos[i].frames[0].expr).toBe(sol.pasos[i - 1].frames.at(-1)!.expr)
  }
  // El resultado final está simplificado.
  if (sol.resultado.tipo === 'valor' && sol.pasos.length) {
    const ultimo = sol.pasos.at(-1)!.frames.at(-1)!.expr
    expect(textoDe(ultimo)).toBe(textoDe(nodoDe(new Ids(), sol.resultado.valor)))
  }
  return sol
}

describe('aritmética: resultados', () => {
  it.each([
    ['3/4 + 5/6', f(19, 12)],
    ['-2 · (4 - 7)', f(6)],
    ['2 + 3 · 4', f(14)],
    ['12 ÷ 3 · 2', f(8)],
    ['-3^2 + 2^3', f(-1)],
    ['(-2)^3', f(-8)],
    ['5 - (-3)', f(8)],
    ['-3 - 5', f(-8)],
    ['3 - 8', f(-5)],
    ['-3/4 + 1/2', f(-1, 4)],
    ['2 - 3/4', f(5, 4)],
    ['1/2 ÷ 3/4', f(2, 3)],
    ['6/2 + 1', f(4)],
    ['6 ÷ 2(1+2)', f(9)],
    ['\\frac{1/2}{3}', f(1, 6)],
    ['4/8', f(1, 2)],
    ['7 ÷ 2', f(7, 2)],
    ['-12 ÷ -4', f(3)],
    ['(1/2)^3', f(1, 8)],
    ['\\mixto{1}{1}{2} · 2', f(3)],
    ['2^-2', f(1, 4)],
    ['2 · (3 + 4 · (5 - 7))', f(-10)],
    ['(-3)^2 - 2^2 · 3', f(-3)],
    ['1/3 + 1/6', f(1, 2)],
    ['0 · 5 + 7', f(7)],
    ['5^0', f(1)],
    ['0 - 0', f(0)],
    ['-(-(-4))', f(-4)],
    ['3/-4', f(-3, 4)],
    ['(2 + 3)/(4 - 9)', f(-1)],
    ['\\frac{2}{3} · \\frac{9}{4}', f(3, 2)],
    ['-1/2 - 1/3', f(-5, 6)],
    ['2/3 ÷ (-4)', f(-1, 6)],
    ['(-1/2)^2', f(1, 4)],
    ['1 - 1/2 - 1/4 - 1/8', f(1, 8)],
    ['8', f(8)],
    ['-8', f(-8)],
  ])('%s = %s', (s, esperado) => {
    expect(valor(s).equals(esperado)).toBe(true)
    revisarSolucion(ast(s))
  })

  it('un número solo no necesita pasos', () => {
    expect(resolver('8').sol.pasos).toEqual([])
  })

  it('una fracción sola se simplifica', () => {
    expect(resolver('6/8').sol.pasos.map((p) => p.regla)).toEqual(['simplificar'])
  })
})

describe('aritmética: orden de los pasos', () => {
  const reglas = (s: string) => resolver(s).sol.pasos.map((p) => p.regla)
  it('multiplica antes de sumar', () => {
    expect(reglas('2 + 3 · 4')).toEqual(['producto', 'suma'])
  })
  it('paréntesis antes que la multiplicación de afuera', () => {
    expect(reglas('2 · 3 + (4 + 5)')).toEqual(['suma', 'producto', 'suma'])
  })
  it('multiplicación y división de izquierda a derecha', () => {
    expect(reglas('12 ÷ 3 · 2')).toEqual(['division', 'producto'])
    expect(reglas('12 · 3 ÷ 2')).toEqual(['producto', 'division'])
  })
  it('potencias antes que multiplicaciones', () => {
    expect(reglas('2 · 3^2')).toEqual(['potencia', 'producto'])
  })
  it('restar un negativo se explica como suma', () => {
    expect(reglas('5 - (-3)')).toEqual(['resta-negativo', 'suma'])
  })
  it('fracciones: denominador común, sumar y simplificar', () => {
    expect(reglas('1/3 + 1/6')).toEqual(['denominador-comun', 'suma-fracciones', 'simplificar'])
  })
  it('dividir fracciones: voltear, multiplicar y simplificar', () => {
    expect(reglas('1/2 ÷ 3/4')).toEqual(['division-fracciones', 'producto-fracciones', 'simplificar'])
  })
  it('el número mixto se convierte primero', () => {
    expect(reglas('\\mixto{2}{1}{3} + 1')[0]).toBe('mixto')
  })
  it('las fracciones de un denominador común no se vuelven a simplificar', () => {
    // 2 = 8/4 no debe regresar a 2.
    expect(reglas('2 + 1/4')).toEqual(['denominador-comun', 'suma-fracciones'])
  })
})

describe('aritmética: casos sin resultado', () => {
  it.each(['3 ÷ 0', '5/(2 - 2)', '0^0', '0^-1', '1 + 2 ÷ (3 - 3)', '0 ÷ 0'])('%s no está definido', (s) => {
    const { p, sol } = resolver(s)
    expect(sol.resultado.tipo).toBe('no-definido')
    expect(comprobarAritmetica(p, sol)).toBe(true)
    expect(despachar(ast(s)).estado).toBe('resuelto')
  })
})

describe('aritmética: lo que no es suyo', () => {
  it.each(['2x + 1', 'x = 3', '2 + 3 = 5', '4^(1/2)', '2^20', 'x^2'])('%s', (s) => {
    expect(detectarAritmetica(ast(s))).toBeNull()
  })
})

// ── Problemas al azar ─────────────────────────────────────────────────────

function azar(r: Rng, prof: number): Nodo {
  let k = 0
  const id = () => `t${++k}-${r.int(0, 1e9)}`
  const hoja = (): Nodo => {
    const x = r.pick(['ent', 'ent', 'neg', 'frac', 'fracneg'] as const)
    if (x === 'ent') return num(id(), r.int(0, 12))
    if (x === 'neg') return neg(id(), num(id(), r.int(1, 12)))
    const d = r.int(2, 9)
    const fr = frac(id(), num(id(), r.int(1, 12)), num(id(), d))
    return x === 'frac' ? fr : neg(id(), fr)
  }
  const arbol = (p: number): Nodo => {
    if (p === 0 || r.bool(0.25)) return hoja()
    const op = r.pick(['suma', 'resta', 'producto', 'division', 'par', 'pot'] as const)
    if (op === 'par') return par(id(), arbol(p - 1))
    if (op === 'pot') return pot(id(), par(id(), arbol(p - 1)), num(id(), r.int(0, 3)))
    const a = arbol(p - 1)
    const b = arbol(p - 1)
    if (op === 'suma') return suma(id(), a, b)
    if (op === 'resta') return resta(id(), a, b)
    if (op === 'producto') return producto(id(), a, b)
    return division(id(), a, b)
  }
  return arbol(prof)
}

describe('aritmética: 1500 problemas al azar', () => {
  it('cada solución es correcta, conserva el valor y pasa la verificación', () => {
    const r = crearRng(2026)
    let resueltos = 0
    let indefinidos = 0
    for (let k = 0; k < 1500; k++) {
      const n = azar(r, r.int(1, 4))
      // Pasa por el texto: así se prueba también lo que escribe una persona.
      const l = leerProblema(textoDe(n).replace(/−/g, '-'))
      if (!l.ok) continue
      if (!detectarAritmetica(l.ast)) continue
      const sol = revisarSolucion(l.ast)
      if (sol.resultado.tipo === 'valor') resueltos++
      else indefinidos++
    }
    expect(resueltos).toBeGreaterThan(800)
    expect(indefinidos).toBeGreaterThan(5)
  })
})

describe('revisar mi respuesta', () => {
  const revisar = (s: string, respuesta: string) => {
    const p = detectarAritmetica(ast(s))!
    return motor.revisar(p, respuesta)
  }

  it('reconoce la respuesta correcta en cualquier forma', () => {
    expect(revisar('3/4 + 5/6', '19/12').estado).toBe('correcto')
    expect(revisar('3/4 + 5/6', '1 7/12').estado).toBe('correcto')
    expect(revisar('2 + 3 · 4', '14').estado).toBe('correcto')
  })

  it('una fracción sin simplificar es "casi"', () => {
    expect(revisar('1/3 + 1/6', '3/6').estado).toBe('casi')
  })

  it('"no está definido" solo es correcto si hay una división entre 0', () => {
    expect(revisar('5/(2 - 2)', 'no está definido').estado).toBe('correcto')
    expect(revisar('3 ÷ 0', '0').estado).toBe('incorrecto')
    const r = revisar('2 + 2', 'no está definido')
    expect(r.estado).toBe('incorrecto')
    expect(r.mensaje).toContain('sí tiene resultado')
  })

  it('una respuesta que no se entiende no cuenta', () => {
    expect(revisar('2 + 2', 'cuatro').estado).toBe('invalido')
  })

  it.each([
    ['2 + 3 · 4', '20', 'izquierda-a-derecha', 'producto'],
    ['1/2 + 1/3', '2/5', 'suma-directa-fracciones', 'denominador-comun'],
    ['2 + 1/4', '3/4', 'entero-mas-fraccion', 'denominador-comun'],
    ['5 - (-3)', '2', 'resta-negativo', 'resta-negativo'],
    ['-2 · (-3)', '-6', 'menos-por-menos', 'producto'],
    ['2^3', '6', 'potencia-por-base', 'potencia'],
    ['2^-2', '-4', 'potencia-negativa', 'potencia'],
    ['5^0', '0', 'potencia-cero', 'potencia'],
    ['-3^2', '9', 'menos-potencia', 'potencia'],
    ['1/2 ÷ 3/4', '3/8', 'division-sin-voltear', 'division-fracciones'],
  ])('%s con respuesta %s → %s', (s, respuesta, errorId, regla) => {
    const r = revisar(s, respuesta)
    expect(r.estado).toBe('incorrecto')
    if (r.estado !== 'incorrecto') return
    expect(r.errorId).toBe(errorId)
    const { sol } = resolver(s)
    expect(r.paso).toBeDefined()
    expect(sol.pasos[r.paso!].regla).toBe(regla)
  })

  it('el signo cambiado se reconoce con la regla general', () => {
    const r = revisar('3 - 8', '5')
    expect(r.estado === 'incorrecto' && r.errorId).toBe('signo')
  })

  it('un error que no reconocemos lo dice sin inventar', () => {
    const r = revisar('2 + 3 · 4', '99')
    expect(r.estado === 'incorrecto' && r.errorId).toBeNull()
  })

  it('en una división entre cero, la respuesta es "no está definido"', () => {
    expect(revisar('3 ÷ 0', 'no está definido').estado).toBe('correcto')
    expect(revisar('3 ÷ 0', '0').estado).toBe('incorrecto')
  })

  it('cada error se calcula con un solo cambio respecto al cálculo correcto', () => {
    // Si el error no aplica, no da valor (no se confunde con la respuesta correcta).
    expect(evaluarCon(ast('2 + 3'), 'izquierda-a-derecha')).toBeNull()
    expect(evaluarCon(ast('2 · 3'), 'potencia-por-base')).toBeNull()
  })

  it('el ejercicio del problema no ofrece como error la respuesta correcta', () => {
    for (const s of ['2 + 3 · 4', '1/2 + 1/3', '-3^2', '2 · 3 + 4']) {
      const ej = ejercicioDe(ast(s))!
      for (const e of ej.errores) expect(e.valor.equals(ej.respuesta)).toBe(false)
    }
  })
})

describe('practicar uno igual', () => {
  const forma = (n: Nodo) => [...recorrer(n)].map((m) => (m.tipo === 'pot' ? `pot` : m.tipo)).join(',')

  it.each(['3/4 + 5/6', '-2 · (4 - 7)', '2 + 3 · 4', '-3^2 + 2^3', '1/2 ÷ 3/4', '\\mixto{1}{1}{2} · 2', '5 - (-3)', '2^-2'])(
    '%s: misma forma, otros números, resultado comprobado',
    (s) => {
      const p = detectarAritmetica(ast(s))!
      for (let semilla = 1; semilla <= 40; semilla++) {
        const q = motor.parecido(p, semilla)
        expect(q, `semilla ${semilla}`).not.toBeNull()
        expect(forma(q!.ast)).toBe(forma(p.ast))
        expect(textoDe(q!.ast)).not.toBe(textoDe(p.ast))
        const sol = motor.resolver(q!)
        expect(comprobarAritmetica(q!, sol)).toBe(true)
        expect(sol.resultado.tipo).toBe('valor')
      }
    },
  )

  it('es reproducible con la misma semilla', () => {
    const p = detectarAritmetica(ast('3/4 + 5/6'))!
    expect(textoDe(motor.parecido(p, 7)!.ast)).toBe(textoDe(motor.parecido(p, 7)!.ast))
  })

  it('conserva exponentes, ceros y unos', () => {
    const p = detectarAritmetica(ast('2^3 + 0 · 5 - 1'))!
    const q = motor.parecido(p, 3)!
    expect(textoDe(q.ast)).toMatch(/\^3 \+ 0 · \d+ − 1$/)
  })
})

describe('el porqué del orden', () => {
  const primera = (s: string) => motor.resolver(motor.detectar(ast(s))!).pasos[0].explicacion
  it.each([
    ['2 + 3 · 4', 'Multiplicar y dividir va antes que sumar y restar.'],
    ['12 ÷ 3 · 2', 'de izquierda a derecha'],
    ['1 + 2^3', 'Las potencias van antes'],
    ['2 · (3 + 4)', 'dentro del paréntesis'],
    ['2 · (3 + 4 · 5)', 'ahí adentro: multiplicar y dividir va antes'],
    ['(2 + 3)/(4 - 9)', 'lo de arriba y lo de abajo de la fracción'],
    ['1 + 2 + 3', 'Entre sumas y restas'],
  ])('%s explica por qué empieza ahí', (s, texto) => {
    expect(primera(s)).toContain(texto)
  })
  it('no lo dice cuando hay una sola operación', () => {
    expect(primera('3 + 4')).not.toMatch(/antes|orden|Primero va/)
  })
})
