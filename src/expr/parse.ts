import type { Nodo } from './ast'

/**
 * Lee un problema escrito como texto ("3/4 + 2·(-5)") o como el LaTeX que
 * produce MathLive ("\frac{3}{4}+2\cdot\left(-5\right)") y lo convierte en AST.
 *
 * Seguridad: lo que llega aquí puede venir de la URL, así que es texto no
 * confiable. El parser solo acepta una lista cerrada de símbolos y comandos;
 * cualquier otra cosa es un error. Nada de lo que entra se muestra como HTML.
 */

export const LARGO_MAXIMO = 300
const PROFUNDIDAD_MAXIMA = 40
const DIGITOS_MAXIMOS = 9

export type AvisoId = 'menos-potencia' | 'division-implicita'
export type Aviso = { id: AvisoId; mensaje: string }

export type ErrorLectura =
  | { tipo: 'vacio'; mensaje: string }
  | { tipo: 'largo'; mensaje: string }
  | { tipo: 'decimal'; mensaje: string }
  | { tipo: 'simbolo'; mensaje: string }
  | { tipo: 'sintaxis'; mensaje: string }
  /**
   * "1 1/2" o "1\frac{1}{2}": puede ser un número mixto o una multiplicación.
   * No adivinamos: la pantalla pregunta. Las alternativas son el problema
   * completo reescrito de cada forma.
   */
  | {
      tipo: 'mixto-ambiguo'
      mensaje: string
      entero: number
      num: number
      den: number
      comoMixto: string
      comoProducto: string
    }

export type Lectura = { ok: true; ast: Nodo; avisos: Aviso[] } | { ok: false; error: ErrorLectura }

// ── Tokens ───────────────────────────────────────────────────────────────

type Tok =
  | { t: 'num'; v: number; i: number; f: number }
  | { t: 'var'; v: string; i: number; f: number }
  | { t: '+' | '-' | '/' | '÷' | '^' | '=' | '(' | ')' | '{' | '}'; i: number; f: number }
  | { t: '*'; forma: 'punto' | 'cruz'; i: number; f: number }
  | { t: 'frac' | 'mixto'; i: number; f: number }

class Fallo extends Error {
  readonly error: ErrorLectura
  constructor(error: ErrorLectura) {
    super(error.mensaje)
    this.error = error
  }
}

const falla = (tipo: 'sintaxis' | 'simbolo' | 'decimal', mensaje: string): never => {
  throw new Fallo({ tipo, mensaje })
}

/** Comandos de LaTeX que entendemos. Todo lo demás se rechaza. */
const COMANDOS: Record<string, Tok['t'] | 'punto' | 'cruz' | 'espacio' | 'ignorar'> = {
  frac: 'frac',
  dfrac: 'frac',
  tfrac: 'frac',
  mixto: 'mixto',
  cdot: 'punto',
  times: 'cruz',
  div: '÷',
  left: 'ignorar',
  right: 'ignorar',
  ',': 'espacio',
  ';': 'espacio',
  ':': 'espacio',
  '!': 'espacio',
  ' ': 'espacio',
  quad: 'espacio',
}

/** Unifica los signos que escribe la gente: −, ×, ·, ÷, ², ³. */
export function normalizarProblema(texto: string): string {
  return texto
    .normalize('NFC')
    .replace(/[−–—‐]/g, '-')
    .replace(/[⋅∙•]/g, '·')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .trim()
}

function tokenizar(s: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  const empuja = (t: Tok) => toks.push(t)
  while (i < s.length) {
    const c = s[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '~') {
      i++
      continue
    }
    if (/[0-9]/.test(c)) {
      let f = i
      while (f < s.length && /[0-9]/.test(s[f])) f++
      if ((s[f] === '.' || s[f] === ',') && /[0-9]/.test(s[f + 1] ?? '')) {
        falla('decimal', 'Todavía no resuelvo problemas con decimales. Si puedes, escríbelo con fracciones: 0.5 es 1/2.')
      }
      const texto = s.slice(i, f)
      if (texto.length > DIGITOS_MAXIMOS) falla('sintaxis', `El número ${texto} es demasiado grande para este problema.`)
      empuja({ t: 'num', v: Number(texto), i, f })
      i = f
      continue
    }
    if (/[a-zA-Z]/.test(c)) {
      let f = i
      while (f < s.length && /[a-zA-Z]/.test(s[f])) f++
      if (f - i >= 3) falla('simbolo', `No entiendo «${s.slice(i, f)}». Usa números, letras sueltas como x y los signos de operación.`)
      for (let k = i; k < f; k++) empuja({ t: 'var', v: s[k], i: k, f: k + 1 })
      i = f
      continue
    }
    if (c === '\\') {
      let f = i + 1
      if (/[a-zA-Z]/.test(s[f] ?? '')) {
        while (f < s.length && /[a-zA-Z]/.test(s[f])) f++
      } else {
        f++
      }
      const nombre = s.slice(i + 1, f)
      const que = Object.hasOwn(COMANDOS, nombre) ? COMANDOS[nombre] : undefined
      if (que === undefined) {
        falla('simbolo', nombre === 'placeholder' ? 'Falta llenar un espacio del problema.' : `Todavía no entiendo el símbolo «\\${nombre}».`)
      } else if (que === 'punto' || que === 'cruz') {
        empuja({ t: '*', forma: que, i, f })
      } else if (que !== 'espacio' && que !== 'ignorar') {
        empuja({ t: que, i, f } as Tok)
      }
      i = f
      continue
    }
    const simple: Record<string, Tok['t']> = {
      '+': '+',
      '-': '-',
      '/': '/',
      '÷': '÷',
      ':': '÷',
      '^': '^',
      '=': '=',
      '(': '(',
      '[': '(',
      ')': ')',
      ']': ')',
      '{': '{',
      '}': '}',
    }
    if (c === '*' || c === '·') {
      empuja({ t: '*', forma: 'punto', i, f: i + 1 })
    } else if (c === '×') {
      empuja({ t: '*', forma: 'cruz', i, f: i + 1 })
    } else if (Object.hasOwn(simple, c)) {
      empuja({ t: simple[c], i, f: i + 1 } as Tok)
    } else if ((c === '.' || c === ',') && /[0-9]/.test(s[i + 1] ?? '')) {
      falla('decimal', 'Todavía no resuelvo problemas con decimales. Si puedes, escríbelo con fracciones: 0.5 es 1/2.')
    } else {
      falla('simbolo', `No reconozco el símbolo «${c}».`)
    }
    i++
  }
  return toks
}

// ── Parser ───────────────────────────────────────────────────────────────

class Lector {
  private pos = 0
  private cuenta = 0
  private profundidad = 0
  readonly avisos: Aviso[] = []
  private readonly toks: Tok[]
  private readonly fuente: string

  constructor(toks: Tok[], fuente: string) {
    this.toks = toks
    this.fuente = fuente
  }

  private id() {
    return `n${++this.cuenta}`
  }
  private mira(k = 0): Tok | undefined {
    return this.toks[this.pos + k]
  }
  private toma(): Tok {
    const t = this.toks[this.pos++]
    if (!t) falla('sintaxis', 'El problema está incompleto: falta algo al final.')
    return t
  }
  private espera(t: Tok['t'], mensaje: string) {
    const x = this.mira()
    if (!x || x.t !== t) falla('sintaxis', mensaje)
    this.pos++
  }
  private entra() {
    if (++this.profundidad > PROFUNDIDAD_MAXIMA) falla('sintaxis', 'El problema tiene demasiados paréntesis anidados.')
  }
  private sale() {
    this.profundidad--
  }

  problema(): Nodo {
    if (this.toks.length === 0) throw new Fallo({ tipo: 'vacio', mensaje: 'Escribe un problema.' })
    const izq = this.expresion()
    let r: Nodo = izq
    if (this.mira()?.t === '=') {
      this.pos++
      if (!this.mira()) falla('sintaxis', 'Después del signo = falta el otro lado.')
      const der = this.expresion()
      r = { tipo: 'igual', id: this.id(), izq, der }
      if (this.mira()?.t === '=') falla('sintaxis', 'Solo puede haber un signo = en el problema.')
    }
    const resto = this.mira()
    if (resto) {
      if (resto.t === ')' || resto.t === '}') falla('sintaxis', 'Hay un paréntesis que se cierra pero nunca se abrió.')
      falla('sintaxis', 'No entiendo cómo sigue el problema después de esta parte.')
    }
    return r
  }

  private expresion(): Nodo {
    this.entra()
    if (this.mira()?.t === '=') falla('sintaxis', 'Antes del signo = falta un lado.')
    let n = this.termino()
    for (let t = this.mira(); t && (t.t === '+' || t.t === '-'); t = this.mira()) {
      this.pos++
      if (!this.mira()) falla('sintaxis', `Después del ${t.t === '+' ? '+' : '−'} falta un número.`)
      const der = this.termino()
      n = t.t === '+' ? { tipo: 'suma', id: this.id(), izq: n, der } : { tipo: 'resta', id: this.id(), izq: n, der }
    }
    this.sale()
    return n
  }

  /** ¿El siguiente token empieza algo que se multiplica sin signo (2x, 3(4))? */
  private empiezaPrimario(t: Tok | undefined) {
    return !!t && (t.t === 'num' || t.t === 'var' || t.t === '(' || t.t === '{' || t.t === 'frac' || t.t === 'mixto')
  }

  private termino(): Nodo {
    let n = this.unario()
    for (;;) {
      const t = this.mira()
      if (!t) break
      if (t.t === '*' || t.t === '÷' || t.t === '/') {
        this.pos++
        if (!this.mira()) falla('sintaxis', 'Después del último signo falta un número.')
        const der = this.unario()
        if (t.t === '*') n = { tipo: 'producto', id: this.id(), izq: n, der, forma: t.forma }
        else if (t.t === '÷') n = { tipo: 'division', id: this.id(), izq: n, der }
        else n = { tipo: 'frac', id: this.id(), num: quitaPar(n), den: quitaPar(der) }
        continue
      }
      if (this.empiezaPrimario(t)) {
        this.revisaJuntos(n, t)
        const der = this.potencia()
        if (n.tipo === 'division' && der.tipo === 'par' && !this.avisos.some((a) => a.id === 'division-implicita')) {
          this.avisos.push({
            id: 'division-implicita',
            mensaje:
              'Esta forma de escribir se presta a confusión. Aquí la multiplicación sin signo va en el mismo orden que la división, de izquierda a derecha. Algunos libros y calculadoras lo leen distinto y les da otro resultado. Para que no haya duda, usa paréntesis.',
          })
        }
        n = { tipo: 'producto', id: this.id(), izq: n, der, forma: 'implicita' }
        continue
      }
      break
    }
    return n
  }

  /** Revisa dos cosas pegadas sin signo: "x2" y "1 1/2" no se aceptan tal cual. */
  private revisaJuntos(izq: Nodo, t: Tok) {
    const ultimo = this.toks[this.pos - 1]
    if (ultimo?.t === 'var' && t.t === 'num') falla('sintaxis', `Escribe el número antes de la letra: ${t.v}${ultimo.v}, no ${ultimo.v}${t.v}.`)
    if (ultimo?.t !== 'num') return
    if (t.t === 'num' || t.t === 'frac') {
      const frac = this.fraccionLiteral()
      if (frac && izq.tipo === 'num') {
        const entero = izq.valor
        const ini = ultimo.i
        const antes = this.fuente.slice(0, ini)
        const despues = this.fuente.slice(frac.fin)
        throw new Fallo({
          tipo: 'mixto-ambiguo',
          mensaje: `No sé si «${entero} ${frac.num}/${frac.den}» es un número mixto o una multiplicación.`,
          entero,
          num: frac.num,
          den: frac.den,
          comoMixto: `${antes}\\mixto{${entero}}{${frac.num}}{${frac.den}}${despues}`,
          comoProducto: `${antes}${entero}\\cdot\\frac{${frac.num}}{${frac.den}}${despues}`,
        })
      }
      if (t.t === 'num') falla('sintaxis', `Entre ${izq.tipo === 'num' ? izq.valor : 'un número'} y ${t.v} falta un signo de operación.`)
    }
  }

  /** Si lo que sigue es una fracción de dos enteros (1/2 o \frac{1}{2}), dice dónde termina. */
  private fraccionLiteral(): { num: number; den: number; fin: number } | null {
    const a = this.mira()
    if (a?.t === 'num') {
      const b = this.mira(1)
      const c = this.mira(2)
      if (b?.t === '/' && c?.t === 'num') return { num: a.v, den: c.v, fin: c.f }
      return null
    }
    if (a?.t === 'frac') {
      const t = this.toks.slice(this.pos + 1, this.pos + 7)
      if (t[0]?.t === '{' && t[1]?.t === 'num' && t[2]?.t === '}' && t[3]?.t === '{' && t[4]?.t === 'num' && t[5]?.t === '}') {
        return { num: (t[1] as { v: number }).v, den: (t[4] as { v: number }).v, fin: t[5].f }
      }
    }
    return null
  }

  private unario(): Nodo {
    const t = this.mira()
    if (t?.t === '-' || t?.t === '+') {
      this.pos++
      this.entra()
      if (!this.mira()) falla('sintaxis', 'Después del signo falta un número.')
      const arg = this.unario()
      this.sale()
      if (t.t === '+') return arg
      if (arg.tipo === 'pot' && arg.base.tipo === 'num' && !this.avisos.some((a) => a.id === 'menos-potencia')) {
        this.avisos.push({
          id: 'menos-potencia',
          mensaje: `Ojo: el exponente solo afecta al ${arg.base.valor}, no al signo menos. Si quieres elevar el número negativo, escríbelo entre paréntesis: (−${arg.base.valor})${exponenteTexto(arg.exp)}.`,
        })
      }
      return { tipo: 'neg', id: this.id(), arg }
    }
    return this.potencia()
  }

  private potencia(): Nodo {
    const base = this.primario()
    if (this.mira()?.t === '^') {
      this.pos++
      if (!this.mira()) falla('sintaxis', 'Falta el exponente.')
      this.entra()
      const exp = this.unario()
      this.sale()
      return { tipo: 'pot', id: this.id(), base, exp }
    }
    return base
  }

  /** Un grupo entre llaves de LaTeX, o un solo dígito/letra (\frac12). */
  private argumento(): Nodo {
    const t = this.mira()
    if (t?.t === '{') return this.primario()
    if (t?.t === 'num') {
      // \frac12: cada argumento es un solo dígito
      this.pos++
      const texto = String(t.v)
      if (texto.length > 1) {
        this.toks.splice(this.pos, 0, { t: 'num', v: Number(texto.slice(1)), i: t.i + 1, f: t.f })
      }
      return { tipo: 'num', id: this.id(), valor: Number(texto[0]) }
    }
    if (t?.t === 'var') return this.primario()
    return falla('sintaxis', 'A la fracción le falta el número de arriba o el de abajo.')
  }

  private primario(): Nodo {
    const t = this.toma()
    switch (t.t) {
      case 'num': {
        const n: Nodo = { tipo: 'num', id: this.id(), valor: t.v }
        // 3/4 escrito entre dos números es una fracción: se agrupa antes que todo.
        const b = this.mira()
        const c = this.mira(1)
        if (b?.t === '/' && c?.t === 'num' && this.mira(2)?.t !== '^') {
          this.pos += 2
          return { tipo: 'frac', id: this.id(), num: n, den: { tipo: 'num', id: this.id(), valor: c.v } }
        }
        return n
      }
      case 'var':
        return { tipo: 'var', id: this.id(), nombre: t.v }
      case '(': {
        this.entra()
        if (this.mira()?.t === ')') falla('sintaxis', 'Hay un paréntesis vacío.')
        const arg = this.expresion()
        this.espera(')', 'Falta cerrar un paréntesis.')
        this.sale()
        return { tipo: 'par', id: this.id(), arg }
      }
      case '{': {
        this.entra()
        if (this.mira()?.t === '}') falla('sintaxis', 'Falta llenar un espacio del problema.')
        const arg = this.expresion()
        this.espera('}', 'Falta cerrar una llave.')
        this.sale()
        return arg
      }
      case 'frac': {
        this.entra()
        const num = this.argumento()
        const den = this.argumento()
        this.sale()
        return { tipo: 'frac', id: this.id(), num, den }
      }
      case 'mixto': {
        const partes: number[] = []
        for (let k = 0; k < 3; k++) {
          this.espera('{', 'El número mixto está incompleto.')
          const x = this.toma()
          if (x.t !== 'num') falla('sintaxis', 'En un número mixto solo van números enteros.')
          this.espera('}', 'El número mixto está incompleto.')
          partes.push((x as { v: number }).v)
        }
        const [entero, num, den] = partes
        if (den < 2 || num < 1 || num >= den) falla('sintaxis', 'En un número mixto, la fracción tiene que ser menor que 1, como 1 ½ o 2 ¾.')
        return { tipo: 'mixto', id: this.id(), entero, num, den }
      }
      case ')':
      case '}':
        return falla('sintaxis', 'Hay un paréntesis que se cierra pero nunca se abrió.')
      case '=':
        return falla('sintaxis', 'Antes del signo = falta un lado.')
      default:
        return falla('sintaxis', 'Falta un número antes de este signo.')
    }
  }
}

const SUPERINDICES = '⁰¹²³⁴⁵⁶⁷⁸⁹'
/** "²" si el exponente es un número; si no, "^…". */
function exponenteTexto(e: Nodo): string {
  return e.tipo === 'num' ? [...String(e.valor)].map((d) => SUPERINDICES[Number(d)]).join('') : ' elevado a la potencia'
}

function quitaPar(n: Nodo): Nodo {
  return n.tipo === 'par' ? n.arg : n
}

/** Punto de entrada: nunca lanza; devuelve el AST o un error para mostrar como texto. */
export function leerProblema(entrada: string): Lectura {
  if (typeof entrada !== 'string') return { ok: false, error: { tipo: 'vacio', mensaje: 'Escribe un problema.' } }
  if (entrada.length > LARGO_MAXIMO * 3) {
    return { ok: false, error: { tipo: 'largo', mensaje: `El problema es demasiado largo. Escribe uno de menos de ${LARGO_MAXIMO} caracteres.` } }
  }
  const s = normalizarProblema(entrada)
  if (s === '') return { ok: false, error: { tipo: 'vacio', mensaje: 'Escribe un problema.' } }
  if (s.length > LARGO_MAXIMO) {
    return { ok: false, error: { tipo: 'largo', mensaje: `El problema es demasiado largo. Escribe uno de menos de ${LARGO_MAXIMO} caracteres.` } }
  }
  try {
    const lector = new Lector(tokenizar(s), s)
    const ast = lector.problema()
    return { ok: true, ast, avisos: lector.avisos }
  } catch (e) {
    if (e instanceof Fallo) return { ok: false, error: e.error }
    return { ok: false, error: { tipo: 'sintaxis', mensaje: 'No pude leer el problema. Revisa que esté bien escrito.' } }
  }
}
