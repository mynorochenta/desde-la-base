import { describe, expect, it } from 'vitest'
import { conceptos } from '../../content/concepts'
import { f, Fraction } from '../../engine/fraction'
import { crearRng, type Rng } from '../../engine/rng'
import type { Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'
import { leerProblema } from '../../expr/parse'
import { textoDe } from '../../expr/tokens'
import { porQueNo, temaCercano } from '../cercano'
import { despachar } from '../registro'
import type { Resultado } from '../tipos'
import { comprobarEcuacion, detectarEcuacion, motor, type ProblemaEcuacion } from './motor'
import { sustituir } from '../../expr/sustituir'
import { resolverEcuacion } from './pasos'

const ast = (s: string): Nodo => {
  const r = leerProblema(s)
  if (!r.ok) throw new Error(`${s}: ${r.error.mensaje}`)
  return r.ast
}

const problema = (s: string): ProblemaEcuacion => {
  const p = detectarEcuacion(ast(s))
  if (!p) throw new Error(`${s} no se detectó`)
  return p
}

/** ¿El frame se cumple con este valor de la letra? */
function cumple(n: Nodo, letra: string, v: Fraction): boolean {
  if (n.tipo !== 'igual') return false
  const a = evaluar(n.izq, { [letra]: v })
  const b = evaluar(n.der, { [letra]: v })
  return a.ok && b.ok && a.valor.equals(b.valor)
}

const PRUEBAS = [f(0), f(1), f(-3), f(7, 2)]

/** Todo lo que tiene que cumplir una solución, paso por paso. */
function revisarSolucion(n: Nodo) {
  const p = detectarEcuacion(n)
  expect(p, textoDe(n)).not.toBeNull()
  const sol = motor.resolver(p!)
  expect(comprobarEcuacion(p!, sol), textoDe(n)).toBe(true)
  const r = sol.resultado
  for (const paso of sol.pasos) {
    expect(paso.titulo.length).toBeGreaterThan(0)
    expect(paso.explicacion.length).toBeGreaterThan(20)
    for (const c of paso.conceptos) expect(conceptos[c]).toBeDefined()
    expect(paso.conceptos).toContain('ecuaciones-lineales')
    // La explicación principal es la balanza; el atajo solo va en la nota.
    expect(paso.explicacion).not.toMatch(/signo contrario/)
    if (paso.regla === 'mover-x' || paso.regla === 'mover-numero') {
      expect(paso.explicacion).toMatch(/en los dos lados/)
      expect(paso.nota).toMatch(/^Atajo/)
    }
    // Cada frame tiene las mismas soluciones que el problema.
    for (const fr of paso.frames) {
      const t = `${textoDe(n)}: frame ${textoDe(fr.expr)}`
      if (r.tipo === 'solucion') {
        expect(cumple(fr.expr, r.variable, r.valor), t).toBe(true)
        expect(cumple(fr.expr, r.variable, r.valor.add(Fraction.uno)), t).toBe(false)
      } else if (r.tipo === 'infinitas') {
        for (const v of PRUEBAS) expect(cumple(fr.expr, p!.letra, v), t).toBe(true)
      } else {
        for (const v of PRUEBAS) expect(cumple(fr.expr, p!.letra, v), t).toBe(false)
      }
    }
  }
  for (let i = 1; i < sol.pasos.length; i++) {
    expect(sol.pasos[i].frames[0].expr).toEqual(sol.pasos[i - 1].frames.at(-1)!.expr)
  }
  // El último frame es "x = valor" (o la igualdad sin letra).
  if (r.tipo === 'solucion' && sol.pasos.length) {
    const ultimo = sol.pasos.at(-1)!.frames.at(-1)!.expr
    expect(ultimo.tipo === 'igual' && ultimo.izq.tipo === 'var').toBe(true)
  }
  return sol
}

const resultado = (s: string): Resultado => revisarSolucion(ast(s)).resultado

describe('ecuaciones: resultados', () => {
  it.each([
    ['2x - 1 = 8x + 11', f(-2)],
    ['x + 5 = 12', f(7)],
    ['3x = 12', f(4)],
    ['-x = 4', f(-4)],
    ['5 = 2x + 1', f(2)],
    ['3(x + 2) = 2x - 5', f(-11)],
    ['4 - (x - 3) = 2x', f(7, 3)],
    ['x/2 + 1/3 = 2', f(10, 3)],
    ['(x + 1)/2 = x/3', f(-3)],
    ['3x + 2x - 4 = 11', f(3)],
    ['7x = 0', f(0)],
    ['x = 5', f(5)],
    ['2(3x - 1) - 4(x + 2) = 0', f(5)],
    ['-(x + 3) = 2(x - 1) + 4', f(-5, 3)],
    ['x/3 - x/4 = 1', f(12)],
    ['2y + 1 = 7', f(3)],
    ['6 = -3x', f(-2)],
    ['x · 4 = 2', f(1, 2)],
    ['2^2 x - 3 = 5', f(2)],
    ['\\frac{2x}{3} = 4', f(6)],
  ])('%s → %s', (s, v) => {
    const r = resultado(s)
    expect(r.tipo).toBe('solucion')
    if (r.tipo === 'solucion') expect(r.valor.equals(v), r.valor.toString()).toBe(true)
  })

  it('usa la letra que escribiste', () => {
    const r = resultado('3a - 2 = 10')
    expect(r.tipo === 'solucion' && r.variable).toBe('a')
  })

  it.each(['2(x + 1) = 2x + 5', 'x + 1 = x + 2', '3x - 3x = 4', '0x = 5'])('%s no tiene solución', (s) => {
    expect(resultado(s).tipo).toBe('sin-solucion')
  })

  it.each(['2(x + 1) = 2x + 2', 'x + 1 = 1 + x', '3x - 3x = 0', '2x + 3 = 2x + 3 + 0'])('%s tiene infinitas soluciones', (s) => {
    expect(resultado(s).tipo).toBe('infinitas')
  })

  it('los tres casos terminan explicando qué significa', () => {
    const sin = revisarSolucion(ast('x + 1 = x + 2'))
    const ultimo = sin.pasos.at(-1)!
    expect(ultimo.regla).toBe('sin-x')
    expect(ultimo.explicacion).toMatch(/no tiene solución/)
    expect(textoDe(ultimo.frames[0].expr)).toBe('0 = 1')
    expect(ultimo.visual).toMatchObject({ tipo: 'balanza', equilibrada: false })
    const inf = revisarSolucion(ast('2(x + 1) = 2x + 2'))
    expect(inf.pasos.at(-1)!.explicacion).toMatch(/infinitas soluciones: cualquier número sirve/)
    expect(textoDe(inf.pasos.at(-1)!.frames[0].expr)).toBe('0 = 0')
  })

  it('los pasos que cambian los dos lados traen la balanza', () => {
    const sol = revisarSolucion(ast('2x - 1 = 8x + 11'))
    expect(sol.pasos.map((p) => p.regla)).toEqual(['mover-x', 'mover-numero', 'dividir'])
    expect(sol.pasos.map((p) => p.visual?.tipo === 'balanza' && p.visual.operacion)).toEqual(['− 8x', '+ 1', '÷ (−6)'])
  })

  it('dividir explica que el número no cambia de signo al pasar', () => {
    const sol = revisarSolucion(ast('-2x = 6'))
    expect(sol.pasos[0].nota).toMatch(/no cambia de signo/)
  })
})

describe('ecuaciones: lo que no es lineal se rechaza con su razón', () => {
  it.each([
    ['x^2 = 4', /cuadrática/],
    ['x · x = 4', /cuadrática/],
    ['x(x + 1) = 2', /cuadrática/],
    ['1/x = 2', /denominador/],
    ['3/(x + 1) = 2', /denominador/],
    ['x + y = 3', /2 letras \(x y y\)/],
    ['2^x = 8', /exponente/],
    ['x^3 = 8', /exponente/],
    ['2x + 1', /no tiene signo =/],
    ['x/(2 - 2) = 1', /división entre 0/],
    ['2 + 3 = 5', /No tiene letra/],
  ])('%s', (s, razon) => {
    const n = ast(s)
    expect(detectarEcuacion(n)).toBeNull()
    expect(despachar(n).estado).toBe('no-reconocido')
    expect(porQueNo(n)).toMatch(razon)
  })

  it('sugiere el tema más cercano', () => {
    expect(temaCercano(ast('x^2 = 4'))).toBe('ecuaciones-lineales')
    expect(temaCercano(ast('2 + 3 = 5'))).toBe('enteros')
    expect(temaCercano(ast('2 · 3 + 1 = 7'))).toBe('jerarquia')
  })

  it('los problemas de aritmética siguen yendo a su motor', () => {
    const d = despachar(ast('2 + 3 · 4'))
    expect(d.estado === 'resuelto' && d.motor.id).toBe('aritmetica')
    const e = despachar(ast('2x + 3 = 7'))
    expect(e.estado === 'resuelto' && e.motor.id).toBe('ecuacion-lineal')
  })
})

describe('ecuaciones: comprobación', () => {
  it('rechaza una solución equivocada', () => {
    const p = problema('2x - 1 = 8x + 11')
    expect(comprobarEcuacion(p, { pasos: [], resultado: { tipo: 'solucion', variable: 'x', valor: f(2) } })).toBe(false)
    expect(comprobarEcuacion(p, { pasos: [], resultado: { tipo: 'infinitas' } })).toBe(false)
    expect(comprobarEcuacion(p, { pasos: [], resultado: { tipo: 'solucion', variable: 'x', valor: f(-2) } })).toBe(true)
  })

  it('rechaza "infinitas" cuando no hay solución, y al revés', () => {
    expect(comprobarEcuacion(problema('x + 1 = x + 2'), { pasos: [], resultado: { tipo: 'infinitas' } })).toBe(false)
    expect(comprobarEcuacion(problema('x + 1 = x + 1'), { pasos: [], resultado: { tipo: 'sin-solucion' } })).toBe(false)
  })

  it('sustituir pone el número entre paréntesis cuando hace falta', () => {
    expect(textoDe(sustituir(ast('2x - 1 = 8x + 11'), 'x', f(-2)))).toBe('2 · (−2) − 1 = 8 · (−2) + 11')
    expect(textoDe(sustituir(ast('3x = 12'), 'x', f(4)))).toBe('3 · 4 = 12')
  })
})

/** Una ecuación lineal al azar, escrita de varias formas. */
function azar(r: Rng): string {
  const termino = (): string => {
    const k = r.int(0, 5)
    const a = r.nonZero(-9, 9)
    const b = r.nonZero(-9, 9)
    const s = (n: number) => (n < 0 ? `(${n})` : `${n}`)
    if (k === 0) return `${a}x`
    if (k === 1) return `${b}`
    if (k === 2) return `${a}(x + ${s(b)})`
    if (k === 3) return `(x + ${s(b)})/${Math.abs(a) + 1}`
    if (k === 4) return `-(${a}x - ${s(b)})`
    return `x/${Math.abs(b) + 1}`
  }
  const lado = () =>
    Array.from({ length: r.int(1, 3) }, termino)
      .map((t, i) => (i === 0 ? t : `${r.pick(['+', '-'])} ${t}`))
      .join(' ')
  return `${lado()} = ${lado()}`
}

describe('ecuaciones: 800 al azar', () => {
  it('cada solución es correcta y cada paso conserva las soluciones', () => {
    const r = crearRng(2027)
    const casos = { solucion: 0, otros: 0 }
    for (let k = 0; k < 800; k++) {
      const s = azar(r)
      const l = leerProblema(s)
      if (!l.ok) throw new Error(`${s}: ${l.error.mensaje}`)
      if (!detectarEcuacion(l.ast)) continue
      const sol = revisarSolucion(l.ast)
      const d = despachar(l.ast)
      expect(d.estado, s).toBe('resuelto')
      if (sol.resultado.tipo === 'solucion') casos.solucion++
      else casos.otros++
    }
    expect(casos.solucion).toBeGreaterThan(600)
  })
})

describe('ecuaciones: revisar mi respuesta', () => {
  const revisar = (s: string, respuesta: string) => motor.revisar(problema(s), respuesta)

  it('acepta "x = valor" o solo el valor', () => {
    expect(revisar('2x - 1 = 8x + 11', '-2').estado).toBe('correcto')
    expect(revisar('2x - 1 = 8x + 11', 'x = -2').estado).toBe('correcto')
    expect(revisar('2x - 1 = 8x + 11', 'x=−2').estado).toBe('correcto')
    expect(revisar('x/2 + 1/3 = 2', '10/3').estado).toBe('correcto')
    expect(revisar('x/2 + 1/3 = 2', '3 1/3').estado).toBe('correcto')
  })

  it('una fracción sin simplificar es "casi"', () => {
    expect(revisar('4x = 6', '6/4').estado).toBe('casi')
  })

  it('lo que no se entiende no cuenta', () => {
    expect(revisar('2x = 4', 'hola').estado).toBe('invalido')
  })

  it.each([
    ['2x - 1 = 8x + 11', '6/5', 'signo-x', 'mover-x'],
    ['2x - 1 = 8x + 11', '-5/3', 'signo-numero', 'mover-numero'],
    ['2x + 4 = 10', '1', 'dividir-un-termino', 'dividir'],
    ['3x = 12', '9', 'restar-coeficiente', 'dividir'],
    ['3x = 12', '1/4', 'dividir-al-reves', 'dividir'],
    ['-2x = 6', '3', 'signo-division', 'dividir'],
    ['3(x + 2) = 15', '13/3', 'distribuir', 'quitar-parentesis'],
    ['10 - (x + 2) = 5', '7', 'menos-parentesis', 'quitar-parentesis'],
  ])('%s con %s: %s', (s, respuesta, errorId, regla) => {
    const r = revisar(s, respuesta)
    expect(r.estado).toBe('incorrecto')
    if (r.estado !== 'incorrecto') return
    expect(r.errorId).toBe(errorId)
    const sol = resolverEcuacion(problema(s).ast)
    expect(r.paso).toBeDefined()
    expect(sol.pasos[r.paso!].regla).toBe(regla)
  })

  it('reconoce "no tiene solución" e "infinitas"', () => {
    expect(revisar('x + 1 = x + 2', 'no tiene solución').estado).toBe('correcto')
    expect(revisar('x + 1 = x + 2', 'infinitas').estado).toBe('incorrecto')
    expect(revisar('x + 1 = x + 2', '1').estado).toBe('incorrecto')
    expect(revisar('2(x + 1) = 2x + 2', 'infinitas soluciones').estado).toBe('correcto')
    const r = revisar('2(x + 1) = 2x + 2', '3')
    expect(r.estado).toBe('incorrecto')
    expect(r.mensaje).toMatch(/no es el único/)
    expect(revisar('2x = 4', 'no tiene solución').estado).toBe('incorrecto')
  })
})

describe('ecuaciones: practicar uno igual', () => {
  it.each(['2x - 1 = 8x + 11', '3(x + 2) = 2x - 5', 'x/2 + 1/3 = 2', '4 - (x - 3) = 2x', '5 = 2x + 1'])(
    '%s: misma forma, otros números, verificado',
    (s) => {
      const p = problema(s)
      for (const semilla of [1, 2, 3, 4, 5]) {
        const q = motor.parecido(p, semilla)
        expect(q).not.toBeNull()
        expect(textoDe(q!.ast)).not.toBe(textoDe(p.ast))
        // La misma forma: cambian solo los números.
        expect(textoDe(q!.ast).replace(/\d+/g, 'n')).toBe(textoDe(p.ast).replace(/\d+/g, 'n'))
        const sol = motor.resolver(q!)
        expect(sol.resultado.tipo).toBe('solucion')
        expect(motor.comprobar(q!, sol)).toBe(true)
        expect(motor.parecido(p, semilla)).toEqual(q)
      }
    },
  )

  it('si no encuentra uno del mismo tipo, lo dice (null) en vez de cambiar de caso', () => {
    const p = problema('2(x + 1) = 2x + 2')
    for (const semilla of [1, 2, 3]) {
      const q = motor.parecido(p, semilla)
      if (q) expect(motor.resolver(q).resultado.tipo).toBe('infinitas')
    }
  })
})
