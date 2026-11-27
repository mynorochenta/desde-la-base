import { describe, expect, it } from 'vitest'
import { f } from '../engine/fraction'
import { crearRng } from '../engine/rng'
import { recorrer, type Nodo } from './ast'
import { evaluar } from './evaluar'
import { leerProblema } from './parse'
import { latexDe, textoDe, tokens, type Token } from './tokens'

function ast(s: string): Nodo {
  const r = leerProblema(s)
  if (!r.ok) throw new Error(`No se leyó «${s}»: ${r.error.mensaje}`)
  return r.ast
}
const valor = (s: string) => {
  const v = evaluar(ast(s))
  if (!v.ok) throw new Error(`${s}: ${v.motivo}`)
  return v.valor
}
const error = (s: string) => {
  const r = leerProblema(s)
  if (r.ok) throw new Error(`«${s}» no debía leerse`)
  return r.error
}

describe('leerProblema: aritmética', () => {
  it.each([
    ['2 + 3', f(5)],
    ['2 - 3', f(-1)],
    ['-3 + 5', f(2)],
    ['2 · (-3)', f(-6)],
    ['2*-3', f(-6)],
    ['-2 × -3', f(6)],
    ['2 + 3 · 4', f(14)],
    ['(2 + 3) · 4', f(20)],
    ['12 ÷ 3 · 2', f(8)],
    ['12 : 4', f(3)],
    ['10 - 4 - 3', f(3)],
    ['3/4 + 5/6', f(19, 12)],
    ['-3/4', f(-3, 4)],
    ['3/-4', f(-3, 4)],
    ['6 ÷ 3/4', f(8)],
    ['1/2/3', f(1, 6)],
    ['(1 + 2)/3', f(1)],
    ['3/4^2', f(3, 16)],
    ['2^3', f(8)],
    ['2^-2', f(1, 4)],
    ['2^3^2', f(512)],
    ['-3^2', f(-9)],
    ['(-3)^2', f(9)],
    ['-3²', f(-9)],
    ['2(3 + 4)', f(14)],
    ['(2)(3)', f(6)],
    ['6 ÷ 2(1 + 2)', f(9)],
    ['0 · 5', f(0)],
    ['--3', f(3)],
    ['+4', f(4)],
    ['[2 + 3] · 2', f(10)],
    ['−5 – 2', f(-7)],
  ])('%s = %s', (s, esperado) => {
    expect(valor(s).equals(esperado)).toBe(true)
  })
})

describe('leerProblema: LaTeX de MathLive', () => {
  it.each([
    ['\\frac{3}{4}+\\frac{5}{6}', f(19, 12)],
    ['\\frac34', f(3, 4)],
    ['\\dfrac{1}{2}\\cdot\\left(-4\\right)', f(-2)],
    ['2\\times3', f(6)],
    ['12\\div4', f(3)],
    ['2^{3}', f(8)],
    ['\\left(-2\\right)^{2}', f(4)],
    ['\\frac{\\frac{1}{2}}{3}', f(1, 6)],
    ['\\mixto{1}{1}{2}+\\frac{1}{2}', f(2)],
    ['\\mixto{2}{3}{4}', f(11, 4)],
    ['3\\,+\\;4', f(7)],
  ])('%s = %s', (s, esperado) => {
    expect(valor(s).equals(esperado)).toBe(true)
  })
})

describe('leerProblema: ecuaciones', () => {
  it('lee una ecuación con x en los dos lados', () => {
    const a = ast('2x - 1 = 8x + 11')
    expect(a.tipo).toBe('igual')
    if (a.tipo !== 'igual') return
    expect(evaluar(a.izq, { x: f(-2) })).toEqual({ ok: true, valor: f(-5) })
    expect(evaluar(a.der, { x: f(-2) })).toEqual({ ok: true, valor: f(-5) })
  })
  it('2x^2 es 2·(x²), no (2x)²', () => {
    const a = ast('2x^2')
    expect(evaluar(a, { x: f(3) })).toEqual({ ok: true, valor: f(18) })
  })
  it('1/2x es (1/2)·x', () => {
    expect(evaluar(ast('1/2x'), { x: f(4) })).toEqual({ ok: true, valor: f(2) })
  })
  it('x/2 es una fracción', () => {
    const a = ast('x/2')
    expect(a.tipo).toBe('frac')
  })
  it('rechaza dos signos =', () => {
    expect(error('x = 2 = 3').tipo).toBe('sintaxis')
  })
  it('rechaza un lado vacío', () => {
    expect(error('= 3').tipo).toBe('sintaxis')
    expect(error('x =').tipo).toBe('sintaxis')
  })
})

describe('leerProblema: avisos', () => {
  it('avisa en −3² que el exponente no toca al signo', () => {
    const r = leerProblema('-3^2')
    expect(r.ok && r.avisos.map((a) => a.id)).toEqual(['menos-potencia'])
    expect(r.ok && r.avisos[0].mensaje).toMatch(/\(−3\)²/)
  })
  it('no avisa en (−3)²', () => {
    const r = leerProblema('(-3)^2')
    expect(r.ok && r.avisos).toEqual([])
  })
  it('avisa en 6 ÷ 2(1+2) y menciona que algunos dan otro resultado', () => {
    const r = leerProblema('6 ÷ 2(1+2)')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.avisos.map((a) => a.id)).toEqual(['division-implicita'])
    expect(r.avisos[0].mensaje).toMatch(/calculadoras/)
    expect(r.avisos[0].mensaje).toMatch(/paréntesis/)
  })
})

describe('leerProblema: números mixtos', () => {
  it('no adivina en «1 1/2»: pregunta', () => {
    const e = error('1 1/2 + 3')
    expect(e.tipo).toBe('mixto-ambiguo')
    if (e.tipo !== 'mixto-ambiguo') return
    expect([e.entero, e.num, e.den]).toEqual([1, 1, 2])
    expect(valor(e.comoMixto).equals(f(9, 2))).toBe(true)
    expect(valor(e.comoProducto).equals(f(7, 2))).toBe(true)
  })
  it('tampoco adivina en 2\\frac{1}{2}', () => {
    const e = error('2\\frac{1}{2}')
    expect(e.tipo).toBe('mixto-ambiguo')
    if (e.tipo !== 'mixto-ambiguo') return
    expect(valor(e.comoMixto).equals(f(5, 2))).toBe(true)
    expect(valor(e.comoProducto).equals(f(1))).toBe(true)
  })
  it('acepta 2\\frac{x}{3} como multiplicación', () => {
    expect(evaluar(ast('2\\frac{x}{3}'), { x: f(3) })).toEqual({ ok: true, valor: f(2) })
  })
  it('rechaza un mixto con fracción impropia', () => {
    expect(error('\\mixto{1}{5}{2}').tipo).toBe('sintaxis')
  })
  it('dos números pegados sin fracción piden un signo', () => {
    expect(error('2 3').mensaje).toMatch(/falta un signo/)
  })
})

describe('leerProblema: errores claros', () => {
  it.each([
    ['', 'vacio'],
    ['   ', 'vacio'],
    ['0.5 + 1', 'decimal'],
    ['2,5', 'decimal'],
    ['.5', 'decimal'],
    ['(2 + 3', 'sintaxis'],
    ['2 + 3)', 'sintaxis'],
    ['()', 'sintaxis'],
    ['2 +', 'sintaxis'],
    ['· 2', 'sintaxis'],
    ['x2', 'sintaxis'],
    ['sqrt(4)', 'simbolo'],
    ['\\sqrt{4}', 'simbolo'],
    ['2 % 3', 'simbolo'],
    ['\\placeholder{}', 'simbolo'],
    ['1234567890 + 1', 'sintaxis'],
  ])('«%s» → %s', (s, tipo) => {
    expect(error(s).tipo).toBe(tipo)
  })
  it('rechaza un problema demasiado largo', () => {
    expect(error('1+'.repeat(200) + '1').tipo).toBe('largo')
  })
  it('rechaza demasiados paréntesis sin reventar la pila', () => {
    expect(error('('.repeat(60) + '1' + ')'.repeat(60)).tipo).toBe('sintaxis')
    expect(error('-'.repeat(100) + '1').tipo).toBe('sintaxis')
  })
})

describe('evaluar', () => {
  it('división entre cero no está definida', () => {
    expect(evaluar(ast('3 ÷ 0'))).toEqual({ ok: false, motivo: 'division-cero' })
    expect(evaluar(ast('5/(2 - 2)'))).toEqual({ ok: false, motivo: 'division-cero' })
    expect(evaluar(ast('0^-1'))).toEqual({ ok: false, motivo: 'division-cero' })
  })
  it('0^0 no está definido', () => {
    expect(evaluar(ast('0^0'))).toEqual({ ok: false, motivo: 'cero-a-la-cero' })
  })
  it('rechaza exponentes grandes o con fracción', () => {
    expect(evaluar(ast('2^100'))).toEqual({ ok: false, motivo: 'exponente' })
    expect(evaluar(ast('4^(1/2)'))).toEqual({ ok: false, motivo: 'exponente' })
  })
  it('se detiene si la cuenta crece demasiado', () => {
    expect(evaluar(ast('999999999^12'))).toEqual({ ok: false, motivo: 'demasiado-grande' })
  })
  it('pide valor para las letras', () => {
    expect(evaluar(ast('x + 1'))).toEqual({ ok: false, motivo: 'variable' })
  })
})

describe('tokens y LaTeX', () => {
  it('las claves son únicas en cada expresión', () => {
    const claves = (ts: Token[]): string[] =>
      ts.flatMap((t) =>
        t.tipo === 'frac' ? [t.clave, ...claves(t.num), ...claves(t.den)] : t.tipo === 'pot' ? [t.clave, ...claves(t.base), ...claves(t.exp)] : [t.clave],
      )
    for (const s of ['2x - 1 = 8x + 11', '3/4 + 5/6 · (-2)', '-(2 + 3)^2', '\\mixto{1}{1}{2} ÷ 2(3)']) {
      const c = claves(tokens(ast(s)))
      expect(new Set(c).size).toBe(c.length)
    }
  })
  it('pone paréntesis a un negativo a la derecha de una operación', () => {
    expect(textoDe(ast('2*-3'))).toBe('2 · (−3)')
    expect(textoDe(ast('2 + -3'))).toBe('2 + (−3)')
  })
  it('respeta el signo que usó la persona', () => {
    expect(textoDe(ast('2 × 3 ÷ 4'))).toBe('2 × 3 ÷ 4')
    expect(textoDe(ast('2x + 1'))).toBe('2x + 1')
  })
  it('el LaTeX generado se vuelve a leer igual', () => {
    for (const s of ['3/4 + 5/6', '-3^2', '(-3)^2', '2(3+4) - 5 ÷ (-5)', '\\mixto{2}{1}{3} · 3', '(1/2)^3', '2^-2']) {
      const a = ast(s)
      const b = ast(latexDe(a))
      expect(evaluar(b)).toEqual(evaluar(a))
      expect(textoDe(b)).toBe(textoDe(a))
    }
  })
})

describe('seguridad: lo que entra es texto no confiable', () => {
  const ataques = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '"><svg onload=alert(1)>',
    '\\href{javascript:alert(1)}{x}',
    '\\url{javascript:alert(1)}',
    '\\htmlId{x}{1}',
    '\\html@{x}',
    '\\includegraphics{x}',
    '\\def\\a{1}',
    'javascript:alert(1)',
    '1 + 2 <b>3</b>',
    '&lt;b&gt;',
    '‮1+2',
    '1\u0000+2',
  ]
  it.each(ataques)('rechaza «%s»', (s) => {
    const r = leerProblema(s)
    expect(r.ok).toBe(false)
  })

  it('el LaTeX que generamos solo tiene símbolos de una lista cerrada', () => {
    const permitido = /^(?:[0-9a-zA-Z ]|\\frac|\\mixto|\\cdot|\\times|\\div|\\left\(|\\right\)|[{}^+\-=])*$/
    const r = crearRng(42)
    const piezas = ['1', '23', 'x', '+', '-', '·', '×', '÷', '/', '^', '(', ')', '=', '\\frac{', '}{', '}', '\\mixto{1}{1}{2}', ' ', '<', '\\href', 'a']
    let leidos = 0
    for (let k = 0; k < 3000; k++) {
      const largo = r.int(1, 14)
      let s = ''
      for (let j = 0; j < largo; j++) s += r.pick(piezas)
      const l = leerProblema(s)
      if (!l.ok) continue
      leidos++
      expect(latexDe(l.ast)).toMatch(permitido)
      for (const n of recorrer(l.ast)) if (n.tipo === 'var') expect(n.nombre).toMatch(/^[a-zA-Z]$/)
    }
    expect(leidos).toBeGreaterThan(100)
  })

  it('nunca lanza, sin importar la entrada', () => {
    const r = crearRng(7)
    for (let k = 0; k < 2000; k++) {
      let s = ''
      const largo = r.int(0, 30)
      for (let j = 0; j < largo; j++) s += String.fromCharCode(r.int(0, 0x2fff))
      expect(() => leerProblema(s)).not.toThrow()
    }
  })
})
