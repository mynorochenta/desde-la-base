import type { Nodo } from './ast'

/**
 * Convierte el AST en lo que se dibuja: una lista de tokens con clave estable.
 * La clave sale del id del nodo, así que si un motor conserva el id de un
 * término entre dos pasos, ese término se desliza en vez de redibujarse.
 *
 * El LaTeX también sale de aquí (latexDe), nunca del texto que escribió la
 * persona: así lo que llega a KaTeX solo tiene números, letras sueltas y
 * los pocos comandos que generamos nosotros.
 */

/** `entero-mixto` es la parte entera de un número mixto: la fracción que le sigue es su parte. */
export type RolSimbolo = 'numero' | 'entero-mixto' | 'letra' | 'operador' | 'parentesis' | 'signo'

export type Token =
  | { tipo: 'simbolo'; clave: string; tex: string; rol: RolSimbolo }
  | { tipo: 'frac'; clave: string; num: Token[]; den: Token[] }
  | { tipo: 'pot'; clave: string; base: Token[]; exp: Token[] }

/** Qué tan fuerte "agarra" cada nodo, para saber cuándo hacen falta paréntesis. */
function nivel(n: Nodo): number {
  switch (n.tipo) {
    case 'igual':
      return 0
    case 'suma':
    case 'resta':
      return 1
    case 'producto':
    case 'division':
      return 2
    case 'neg':
      return 3
    case 'pot':
      return 4
    default:
      return 5
  }
}

const sim = (clave: string, tex: string, rol: RolSimbolo): Token => ({ tipo: 'simbolo', clave, tex, rol })

function conParentesis(n: Nodo, poner: boolean): Token[] {
  const dentro = tokens(n)
  if (!poner) return dentro
  return [sim(`${n.id}:a(`, '(', 'parentesis'), ...dentro, sim(`${n.id}:a)`, ')', 'parentesis')]
}

/** Un negativo a la derecha de una operación va entre paréntesis: 2 · (−3). */
const negSuelto = (n: Nodo) => n.tipo === 'neg'

export function tokens(n: Nodo): Token[] {
  switch (n.tipo) {
    case 'num':
      return [sim(n.id, String(n.valor), 'numero')]
    case 'var':
      return [sim(n.id, n.nombre, 'letra')]
    case 'mixto':
      return [
        sim(`${n.id}:e`, String(n.entero), 'entero-mixto'),
        {
          tipo: 'frac',
          clave: n.id,
          num: [sim(`${n.id}:n`, String(n.num), 'numero')],
          den: [sim(`${n.id}:d`, String(n.den), 'numero')],
        },
      ]
    case 'neg':
      return [sim(`${n.id}:-`, '-', 'signo'), ...conParentesis(n.arg, nivel(n.arg) < 4)]
    case 'par':
      return [sim(`${n.id}:(`, '(', 'parentesis'), ...tokens(n.arg), sim(`${n.id}:)`, ')', 'parentesis')]
    case 'suma':
    case 'resta':
      return [
        ...conParentesis(n.izq, nivel(n.izq) < 1),
        sim(`${n.id}:op`, n.tipo === 'suma' ? '+' : '-', 'operador'),
        ...conParentesis(n.der, negSuelto(n.der) || nivel(n.der) < (n.tipo === 'resta' ? 2 : 1)),
      ]
    case 'producto': {
      // (−3) · (−3): el negativo de la izquierda también lleva paréntesis.
      const izq = conParentesis(n.izq, nivel(n.izq) < 2 || (n.izq.tipo === 'neg' && n.forma !== 'implicita'))
      const der = conParentesis(n.der, negSuelto(n.der) || nivel(n.der) < 2)
      if (n.forma === 'implicita') return [...izq, ...der]
      return [...izq, sim(`${n.id}:op`, n.forma === 'cruz' ? '\\times' : '\\cdot', 'operador'), ...der]
    }
    case 'division':
      return [
        ...conParentesis(n.izq, nivel(n.izq) < 2),
        sim(`${n.id}:op`, '\\div', 'operador'),
        ...conParentesis(n.der, negSuelto(n.der) || nivel(n.der) < 3),
      ]
    case 'frac':
      return [{ tipo: 'frac', clave: n.id, num: tokens(n.num), den: tokens(n.den) }]
    case 'pot':
      return [{ tipo: 'pot', clave: n.id, base: conParentesis(n.base, nivel(n.base) < 5 || n.base.tipo === 'frac' || n.base.tipo === 'mixto'), exp: tokens(n.exp) }]
    case 'igual':
      return [...tokens(n.izq), sim(`${n.id}:op`, '=', 'operador'), ...tokens(n.der)]
  }
}

/** LaTeX de una lista de tokens. */
export function latexDeTokens(ts: Token[]): string {
  let r = ''
  for (let k = 0; k < ts.length; k++) {
    const t = ts[k]
    const sig = ts[k + 1]
    if (t.tipo === 'frac') r += `\\frac{${latexDeTokens(t.num)}}{${latexDeTokens(t.den)}}`
    else if (t.tipo === 'pot') r += `{${latexDeTokens(t.base)}}^{${latexDeTokens(t.exp)}}`
    else if (t.rol === 'entero-mixto' && sig?.tipo === 'frac') {
      // \mixto es una macro nuestra: KaTeX y MathLive la conocen (ver MACROS).
      r += `\\mixto{${t.tex}}{${latexDeTokens(sig.num)}}{${latexDeTokens(sig.den)}}`
      k++
    } else if (t.rol === 'parentesis') r += t.tex === '(' ? '\\left(' : '\\right)'
    else r += t.rol === 'operador' || t.rol === 'signo' ? `${t.tex} ` : t.tex
  }
  return r.trim()
}

/** Macros para KaTeX y MathLive: \mixto{1}{1}{2} se dibuja como 1½. */
export const MACROS = { '\\mixto': '#1\\frac{#2}{#3}' } as const

/** LaTeX de una expresión, generado desde el AST. */
export const latexDe = (n: Nodo) => latexDeTokens(tokens(n))

/** Texto plano para lectores de pantalla y para reportes: "3/4 + 2 · (−5)". */
export function textoDe(n: Nodo): string {
  const plano = (ts: Token[]): string =>
    ts
      .map((t) => {
        if (t.tipo === 'frac') return `${envuelve(t.num)}/${envuelve(t.den)}`
        if (t.tipo === 'pot') return `${envuelve(t.base)}^${envuelve(t.exp)}`
        const m: Record<string, string> = { '\\cdot': ' · ', '\\times': ' × ', '\\div': ' ÷ ', '+': ' + ', '=': ' = ' }
        if (t.rol === 'operador') return m[t.tex] ?? ` ${t.tex === '-' ? '−' : t.tex} `
        if (t.rol === 'signo') return '−'
        if (t.rol === 'entero-mixto') return `${t.tex} `
        return t.tex
      })
      .join('')
  const envuelve = (ts: Token[]) => {
    if (ts.length === 1 && ts[0].tipo === 'simbolo') return ts[0].tex
    const primero = ts[0]
    const ultimo = ts[ts.length - 1]
    const yaTiene = primero.tipo === 'simbolo' && primero.tex === '(' && ultimo.tipo === 'simbolo' && ultimo.tex === ')'
    return yaTiene ? plano(ts) : `(${plano(ts)})`
  }
  return plano(tokens(n)).replace(/\s+/g, ' ').trim()
}
