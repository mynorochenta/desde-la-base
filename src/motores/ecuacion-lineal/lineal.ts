import { Fraction } from '../../engine/fraction'
import { recorrer, variables, type Nodo } from '../../expr/ast'
import { evaluar } from '../../expr/evaluar'

/**
 * Una ecuación lineal escrita como listas de términos: cada término es un
 * número o un número por la letra. Cada término guarda un id: es la clave
 * con la que su token viaja de un paso al siguiente.
 */
export type Termino = { id: string; coef: Fraction; x: boolean }
export type Lado = Termino[]
export type Ecuacion = { izq: Lado; der: Lado }

/** Por qué una ecuación con letra no es lineal, o no es nuestra. */
export type Rechazo =
  | 'sin-igual'
  | 'sin-letra'
  | 'varias-letras'
  | 'cuadratica'
  | 'letra-abajo'
  | 'letra-exponente'
  | 'division-cero'
  | 'demasiado-grande'

class NoLineal extends Error {
  readonly motivo: Rechazo
  constructor(motivo: Rechazo) {
    super(motivo)
    this.motivo = motivo
  }
}

const tieneLetra = (n: Nodo) => [...recorrer(n)].some((m) => m.tipo === 'var')

/** Valor de una parte sin letra. */
function constante(n: Nodo): Fraction {
  const v = evaluar(n)
  if (v.ok) return v.valor
  throw new NoLineal(v.motivo === 'division-cero' || v.motivo === 'cero-a-la-cero' ? 'division-cero' : 'demasiado-grande')
}

/**
 * Errores al quitar paréntesis que "Revisar mi respuesta" sabe imitar:
 * multiplicar solo el primer término, o cambiar el signo solo del primero.
 */
export type ErrorParentesis = 'distribuir-uno' | 'menos-uno'

const escala = (ts: Termino[], c: Fraction) => ts.map((t) => ({ ...t, coef: t.coef.mul(c) }))

/** Términos de una suma que está entre paréntesis (o null si no hay paréntesis). */
function dentroDeParentesis(n: Nodo): Nodo | null {
  if (n.tipo !== 'par') return null
  const a = n.arg
  return a.tipo === 'suma' || a.tipo === 'resta' ? a : null
}

/**
 * Expande un lado: quita paréntesis, separa fracciones y calcula lo que es
 * solo números. Lanza NoLineal si aparece x·x, x abajo, etc.
 */
export function expandir(n: Nodo, error?: ErrorParentesis): Termino[] {
  if (!tieneLetra(n)) {
    const v = constante(n)
    return [{ id: n.id, coef: v, x: false }]
  }
  switch (n.tipo) {
    case 'var':
      return [{ id: n.id, coef: Fraction.uno, x: true }]
    case 'par':
      return expandir(n.arg, error)
    case 'neg': {
      const dentro = expandir(n.arg, error)
      if (error === 'menos-uno' && dentroDeParentesis(n.arg)) return dentro.map((t, i) => (i === 0 ? { ...t, coef: t.coef.neg() } : t))
      return escala(dentro, Fraction.of(-1))
    }
    case 'suma':
      return [...expandir(n.izq, error), ...expandir(n.der, error)]
    case 'resta': {
      const der = expandir(n.der, error)
      if (error === 'menos-uno' && dentroDeParentesis(n.der)) {
        return [...expandir(n.izq, error), ...der.map((t, i) => (i === 0 ? { ...t, coef: t.coef.neg() } : t))]
      }
      return [...expandir(n.izq, error), ...escala(der, Fraction.of(-1))]
    }
    case 'producto': {
      const li = tieneLetra(n.izq)
      const ld = tieneLetra(n.der)
      if (li && ld) throw new NoLineal('cuadratica')
      const [c, e] = li ? [constante(n.der), n.izq] : [constante(n.izq), n.der]
      const ts = expandir(e, error)
      if (error === 'distribuir-uno' && dentroDeParentesis(e)) return ts.map((t, i) => (i === 0 ? { ...t, coef: t.coef.mul(c) } : t))
      return escala(ts, c)
    }
    case 'division':
    case 'frac': {
      const arriba = n.tipo === 'frac' ? n.num : n.izq
      const abajo = n.tipo === 'frac' ? n.den : n.der
      if (tieneLetra(abajo)) throw new NoLineal('letra-abajo')
      const d = constante(abajo)
      if (d.isZero()) throw new NoLineal('division-cero')
      return escala(expandir(arriba, error), d.inv())
    }
    case 'pot': {
      if (tieneLetra(n.exp)) throw new NoLineal('letra-exponente')
      const k = constante(n.exp)
      if (k.equals(Fraction.uno)) return expandir(n.base, error)
      throw new NoLineal(k.equals(Fraction.of(2)) ? 'cuadratica' : 'letra-exponente')
    }
    default:
      throw new NoLineal('demasiado-grande')
  }
}

/** Suma de los coeficientes: a·x + b. */
export function forma(ts: Termino[]): { a: Fraction; b: Fraction } {
  let a = Fraction.cero
  let b = Fraction.cero
  for (const t of ts) {
    if (t.x) a = a.add(t.coef)
    else b = b.add(t.coef)
  }
  return { a, b }
}

export type Analisis = { ok: true; letra: string; izq: Termino[]; der: Termino[] } | { ok: false; motivo: Rechazo }

const LIMITE = 100_000

/** ¿Es una ecuación lineal con una sola letra? Si no, dice por qué. */
export function analizar(ast: Nodo, error?: ErrorParentesis): Analisis {
  const letras = variables(ast)
  if (ast.tipo !== 'igual') return { ok: false, motivo: 'sin-igual' }
  if (letras.length === 0) return { ok: false, motivo: 'sin-letra' }
  if (letras.length > 1) return { ok: false, motivo: 'varias-letras' }
  try {
    const izq = expandir(ast.izq, error)
    const der = expandir(ast.der, error)
    // Números muy grandes: mejor no prometer cuentas a mano.
    if ([...izq, ...der].some((t) => Math.abs(t.coef.num) > LIMITE || t.coef.den > LIMITE)) return { ok: false, motivo: 'demasiado-grande' }
    return { ok: true, letra: letras[0], izq, der }
  } catch (e) {
    if (e instanceof NoLineal) return { ok: false, motivo: e.motivo }
    if (e instanceof RangeError) return { ok: false, motivo: 'demasiado-grande' }
    throw e
  }
}
