import type { ConceptoId } from '../../content/concepts'
import { Fraction, mcd } from '../../engine/fraction'
import { hijos, recorrer, type Nodo } from '../../expr/ast'
import { frac, neg, num, producto, resta, suma, division, pot } from '../../expr/construir'
import type { Paso, Resultado, Solucion, Visual } from '../tipos'
import { crudo, esLiteral, Ids, mcm, nodoCrudo, nodoEntero, texto, textoPar, valorDe, type Crudo } from './numeros'

/**
 * Resuelve una operación con enteros y fracciones, un paso a la vez, en el
 * orden de la jerarquía de operaciones:
 *   1. lo que está dentro de paréntesis (y arriba o abajo de una fracción);
 *   2. potencias;
 *   3. multiplicaciones y divisiones, de izquierda a derecha;
 *   4. sumas y restas, de izquierda a derecha.
 * Cada paso cambia una sola cosa y explica por qué.
 */

/** Nombre de la regla de cada paso. "Revisar mi respuesta" lo usa para señalar el paso. */
export type Regla =
  | 'mixto'
  | 'simplificar'
  | 'signo-denominador'
  | 'potencia'
  | 'dos-menos'
  | 'producto'
  | 'producto-fracciones'
  | 'division'
  | 'division-cero'
  | 'division-fracciones'
  | 'fraccion-division'
  | 'suma-negativo'
  | 'resta-negativo'
  | 'suma'
  | 'resta'
  | 'denominador-comun'
  | 'suma-fracciones'

export type PasoAritmetica = Omit<Paso, 'regla'> & { regla: Regla }
export type SolucionAritmetica = Omit<Solucion, 'pasos'> & { pasos: PasoAritmetica[] }

type Accion = {
  titulo: string
  explicacion: string
  nota?: string
  conceptos: ConceptoId[]
  regla: Regla
  /** Cómo queda la parte que cambia, frame por frame. */
  despues: Nodo[]
  visual?: Visual
  /** Si el problema termina aquí sin valor (división entre cero). */
  fin?: Resultado
}

const MAXIMO_PASOS = 120

// ── Árbol: reemplazar y limpiar ──────────────────────────────────────────

/** Copia el árbol cambiando el nodo con ese id. */
export function reemplazar(n: Nodo, id: string, nuevo: Nodo): Nodo {
  if (n.id === id) return nuevo
  switch (n.tipo) {
    case 'num':
    case 'var':
    case 'mixto':
      return n
    case 'neg':
    case 'par':
      return { ...n, arg: reemplazar(n.arg, id, nuevo) }
    case 'frac':
      return { ...n, num: reemplazar(n.num, id, nuevo), den: reemplazar(n.den, id, nuevo) }
    case 'pot':
      return { ...n, base: reemplazar(n.base, id, nuevo), exp: reemplazar(n.exp, id, nuevo) }
    default:
      return { ...n, izq: reemplazar(n.izq, id, nuevo), der: reemplazar(n.der, id, nuevo) }
  }
}

/**
 * Limpieza que no es un paso: quita paréntesis alrededor de un número
 * (al dibujar se vuelven a poner donde hacen falta) y escribe el signo de
 * una fracción adelante: (−3)/4 → −3/4.
 */
export function limpiar(n: Nodo): Nodo {
  switch (n.tipo) {
    case 'num':
    case 'var':
    case 'mixto':
      return n
    case 'par': {
      const a = limpiar(n.arg)
      return esLiteral(a) ? a : { ...n, arg: a }
    }
    case 'neg':
      return { ...n, arg: limpiar(n.arg) }
    case 'frac': {
      const a = limpiar(n.num)
      const b = limpiar(n.den)
      if (a.tipo === 'neg' && a.arg.tipo === 'num' && b.tipo === 'num') {
        return neg(`${n.id}~s`, { ...n, num: a.arg, den: b })
      }
      return { ...n, num: a, den: b }
    }
    case 'pot':
      return { ...n, base: limpiar(n.base), exp: limpiar(n.exp) }
    case 'producto': {
      const izq = limpiar(n.izq)
      const der = limpiar(n.der)
      // 2(3) sin paréntesis se leería "23": se escribe con punto.
      const forma = n.forma === 'implicita' && (der.tipo === 'num' || der.tipo === 'mixto') ? 'punto' : n.forma
      return { ...n, izq, der, forma }
    }
    default:
      return { ...n, izq: limpiar(n.izq), der: limpiar(n.der) }
  }
}

// ── Qué se resuelve ahora ────────────────────────────────────────────────

/** ¿Este número escrito ya está en su forma más simple? */
function simple(c: Crudo): boolean {
  if (c.den === 1) return true
  return c.den > 1 && mcd(c.num, c.den) === 1
}

/** Una fracción escrita que en realidad es un entero (6/2) o tiene el menos abajo. */
function fraccionParaArreglar(m: Nodo, creados: Set<string>): boolean {
  if (m.tipo !== 'frac' || creados.has(m.id)) return false
  const a = m.num
  const b = m.den
  if (b.tipo === 'neg') return esLiteral(m)
  if (a.tipo !== 'num' || b.tipo !== 'num' || b.valor <= 1) return false
  return a.valor % b.valor === 0
}

export function buscar(n: Nodo, raiz: Nodo, creados: Set<string>): Nodo | null {
  // 1. Lo que está dentro de un grupo va primero.
  for (const m of recorrer(n)) {
    if (m.tipo === 'par' && !esLiteral(m.arg)) {
      const r = buscar(m.arg, raiz, creados)
      if (r) return r
    }
    if (m.tipo === 'frac') {
      for (const parte of [m.num, m.den]) {
        if (!esLiteral(parte) && parte.tipo !== 'frac') {
          const r = buscar(parte, raiz, creados)
          if (r) return r
        }
      }
    }
    if (m.tipo === 'pot') {
      for (const parte of [m.base, m.exp]) {
        if (!esLiteral(parte)) {
          const r = buscar(parte, raiz, creados)
          if (r) return r
        }
      }
    }
  }
  const todos = [...recorrer(n)]
  const primero = (f: (m: Nodo) => boolean) => todos.find(f) ?? null
  return (
    primero((m) => m.tipo === 'mixto') ??
    primero((m) => m !== raiz && fraccionParaArreglar(m, creados)) ??
    primero((m) => m.tipo === 'pot' && esLiteral(m.base) && esLiteral(m.exp)) ??
    primero((m) => m.tipo === 'neg' && m.arg.tipo === 'neg') ??
    primero(
      (m) =>
        ((m.tipo === 'producto' || m.tipo === 'division') && esLiteral(m.izq) && esLiteral(m.der)) ||
        (m.tipo === 'frac' && !esLiteral(m) && esLiteral(m.num) && esLiteral(m.den)),
    ) ??
    primero((m) => (m.tipo === 'suma' || m.tipo === 'resta') && esLiteral(m.izq) && esLiteral(m.der)) ??
    primero((m) => m === raiz && esLiteral(m) && (!simple(crudo(m)!) || fraccionParaArreglar(m, new Set())))
  )
}

// ── Textos ───────────────────────────────────────────────────────────────

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
/** Exponente escrito arriba: 3 → ³, −2 → ⁻². */
const sup = (k: number) => (k < 0 ? '⁻' : '') + [...String(Math.abs(k))].map((d) => SUP[Number(d)]).join('')

const signosDe = (...vs: Crudo[]): ConceptoId[] => (vs.some((v) => v.num < 0) ? ['signos'] : [])
const abs = (c: Crudo): Crudo => ({ num: Math.abs(c.num), den: c.den })
const esEntero = (c: Crudo) => c.den === 1
const nombreSigno = (a: Crudo, b: Crudo) =>
  a.num < 0 && b.num < 0 ? 'menos por menos da más' : 'más por menos da menos'

/** Recta numérica para sumas y restas de enteros pequeños. */
function recta(inicio: number, salto: number, voltear: boolean): Visual | undefined {
  const fin = inicio + (voltear ? -salto : salto)
  if ([inicio, salto, fin].some((x) => Math.abs(x) > 20)) return undefined
  return { tipo: 'recta', inicio, saltos: [salto], voltear }
}

// ── Cada acción ──────────────────────────────────────────────────────────

function accion(m: Nodo, ids: Ids, creados: Set<string>): Accion {
  switch (m.tipo) {
    case 'mixto': {
      const total = m.entero * m.den + m.num
      return {
        titulo: `Escribe ${m.entero} ${m.num}/${m.den} como fracción`,
        explicacion: `Un número mixto es un entero más una fracción. Cada entero se parte en ${m.den} pedazos de 1/${m.den}, así que ${m.entero} ${m.entero === 1 ? 'entero son' : 'enteros son'} ${m.entero} · ${m.den} = ${m.entero * m.den} pedazos. Con los ${m.num} que ya había, son ${total} pedazos: ${m.entero} ${m.num}/${m.den} = ${total}/${m.den}.`,
        conceptos: ['fracciones-simplificar'],
        regla: 'mixto',
        despues: [nodoCrudo(ids, total, m.den)],
      }
    }

    case 'frac': {
      const a = crudo(m.num)
      const b = crudo(m.den)
      // La raya es una división: con 0 abajo no está definida.
      if (a && b && b.num === 0) return dividir(a, b, m, ids)
      if (a && b && esEntero(a) && esEntero(b) && b.num < 0) {
        return {
          titulo: 'Pasa el signo menos adelante',
          explicacion: `Una fracción con el menos abajo vale lo mismo que con el menos adelante: ${a.num}/(${texto(b)}) = ${texto({ num: -a.num, den: -b.num })}.`,
          conceptos: ['signos'],
          regla: 'signo-denominador',
          despues: [nodoCrudo(ids, -a.num, -b.num)],
        }
      }
      if (a && b && esEntero(a) && esEntero(b)) {
        // 6/2: una fracción que es un entero.
        const r = a.num / b.num
        return {
          titulo: `${a.num}/${b.num} es ${r}`,
          explicacion: `La raya de una fracción es una división: ${a.num} ÷ ${b.num} = ${r}. Es exacta, así que la fracción vale ${r}.`,
          conceptos: ['fracciones-simplificar'],
          regla: 'simplificar',
          despues: [nodoEntero(ids, r)],
        }
      }
      // Arriba o abajo hay una fracción: la raya es una división.
      return {
        titulo: 'La raya de fracción es una división',
        explicacion: 'Cuando arriba o abajo de una fracción hay otra fracción, conviene escribirla como división: lo de arriba dividido entre lo de abajo.',
        conceptos: ['fracciones-multiplicacion'],
        regla: 'fraccion-division',
        despues: [division(ids.nuevo(), m.num, m.den)],
      }
    }

    case 'pot':
      return potencia(m.base, m.exp, ids)

    case 'neg':
      return {
        titulo: 'Dos signos menos seguidos se cancelan',
        explicacion: 'El opuesto del opuesto es el mismo número: −(−3) = 3. Por eso dos signos menos seguidos se convierten en un más.',
        conceptos: ['signos'],
        regla: 'dos-menos',
        despues: [m.arg.tipo === 'neg' ? m.arg.arg : m.arg],
      }

    case 'producto':
      return multiplicar(crudo(m.izq)!, crudo(m.der)!, m, ids)

    case 'division':
      return dividir(crudo(m.izq)!, crudo(m.der)!, m, ids)

    case 'suma':
    case 'resta':
      return sumarORestar(m, ids, creados)

    default:
      throw new Error(`No sé qué hacer con ${m.tipo}`)
  }
}

function potencia(baseN: Nodo, expN: Nodo, ids: Ids): Accion {
  const base = crudo(baseN)!
  const e = crudo(expN)!
  if (!esEntero(e)) throw new Error('Exponente con fracción')
  const k = e.num
  const conceptos: ConceptoId[] = ['potencias', ...signosDe(base)]
  const b = texto(base)
  const bP = base.num < 0 || base.den !== 1 ? `(${b})` : b

  if (base.num === 0 && k <= 0) {
    return {
      titulo: k === 0 ? '0 elevado a la 0 no está definido' : 'No se puede dividir entre 0',
      explicacion:
        k === 0
          ? '0⁰ no tiene un valor que funcione bien en todos los casos, así que en matemática se dice que no está definido.'
          : `Un exponente negativo significa dividir: 0 elevado a ${k} sería 1 dividido entre 0, y dividir entre 0 no se puede.`,
      conceptos,
      regla: 'potencia',
      despues: [],
      fin: { tipo: 'no-definido', explicacion: k === 0 ? '0⁰ no está definido.' : 'Habría que dividir entre 0.' },
    }
  }
  if (k === 0) {
    return {
      titulo: `${bP}${sup(0)} = 1`,
      explicacion: 'Cualquier número que no sea 0, elevado a la 0, da 1.',
      conceptos,
      regla: 'potencia',
      despues: [nodoEntero(ids, 1)],
    }
  }
  if (k === 1) {
    return {
      titulo: `${bP}${sup(1)} = ${b}`,
      explicacion: 'Un número elevado a la 1 es el mismo número: se usa una sola vez.',
      conceptos,
      regla: 'potencia',
      despues: [nodoCrudo(ids, base.num, base.den)],
    }
  }
  if (k < 0) {
    return {
      titulo: 'El exponente negativo da vuelta al número',
      explicacion: `Un exponente negativo significa "1 dividido entre la potencia con exponente positivo": ${bP}${sup(k)} = 1/${bP}${sup(-k)}.`,
      conceptos,
      regla: 'potencia',
      despues: [frac(ids.nuevo(), num(ids.nuevo(), 1), pot(ids.nuevo(), nodoCrudo(ids, base.num, base.den), num(ids.nuevo(), -k)))],
    }
  }
  const rn = base.num ** k
  const rd = base.den ** k
  if (!Number.isSafeInteger(rn) || !Number.isSafeInteger(rd)) throw new Error('Potencia demasiado grande')
  const despues: Nodo[] = []
  if (k <= 6) {
    let cadena = nodoCrudo(ids, base.num, base.den)
    for (let i = 1; i < k; i++) cadena = producto(ids.nuevo(), cadena, nodoCrudo(ids, base.num, base.den))
    despues.push(cadena)
  }
  despues.push(nodoCrudo(ids, rn, rd))
  const veces = Array.from({ length: Math.min(k, 6) }, () => bP).join(' · ') + (k > 6 ? ' · …' : '')
  let explicacion = `El exponente dice cuántas veces se multiplica la base por sí misma: ${bP}${sup(k)} = ${veces} = ${texto({ num: rn, den: rd })}.`
  if (base.num < 0) {
    explicacion += k % 2 === 0
      ? ' La base es negativa y el exponente es par: los signos menos se cancelan de dos en dos, así que da positivo.'
      : ' La base es negativa y el exponente es impar: sobra un signo menos, así que da negativo.'
  }
  if (base.den !== 1) explicacion += ' En una fracción se eleva el número de arriba y el de abajo.'
  return { titulo: `Calcula la potencia ${bP}${sup(k)}`, explicacion, conceptos, regla: 'potencia', despues }
}

function multiplicar(a: Crudo, b: Crudo, m: Nodo, ids: Ids): Accion {
  const negativo = a.num < 0 !== b.num < 0 && a.num !== 0 && b.num !== 0
  const conceptos = signosDe(a, b)
  const titulo = `Multiplica ${textoPar(a)} · ${textoPar(b)}`
  const signo = conceptos.length ? ` Después el signo: ${nombreSigno(a, b)}.` : ''

  if (esEntero(a) && esEntero(b)) {
    const r = a.num * b.num
    let explicacion: string
    if (a.num === 0 || b.num === 0) explicacion = 'Cualquier número multiplicado por 0 da 0.'
    else if (conceptos.length) explicacion = `Primero multiplica sin fijarte en los signos: ${Math.abs(a.num)} · ${Math.abs(b.num)} = ${Math.abs(r)}.${signo} Queda ${r < 0 ? '−' : ''}${Math.abs(r)}.`
    else if (a.num === 1 || b.num === 1) explicacion = `Multiplicar por 1 deja el número igual: ${a.num} · ${b.num} = ${r}.`
    else explicacion = `Multiplicar es sumar el mismo número varias veces: ${a.num} · ${b.num} es ${veces(a.num, b.num)}, que da ${r}.`
    return { titulo, explicacion, conceptos: conceptos.length ? conceptos : ['enteros'], regla: 'producto', despues: [nodoEntero(ids, r)] }
  }

  // Con fracciones: arriba por arriba y abajo por abajo.
  const rn = Math.abs(a.num * b.num)
  const rd = a.den * b.den
  // Si uno es entero, abajo solo queda el denominador de la fracción.
  const abajo =
    esEntero(a) || esEntero(b)
      ? num(ids.nuevo(), rd)
      : producto(ids.nuevo(), num(ids.nuevo(), a.den), num(ids.nuevo(), b.den))
  const intermedio = frac(
    ids.nuevo(),
    producto(ids.nuevo(), num(ids.nuevo(), Math.abs(a.num)), num(ids.nuevo(), Math.abs(b.num))),
    abajo,
  )
  const explicacion =
    esEntero(a) || esEntero(b)
      ? `Para multiplicar un entero por una fracción, multiplica el entero por el número de arriba. El de abajo se queda igual.${signo}`
      : `Para multiplicar fracciones, multiplica arriba por arriba y abajo por abajo. No hace falta buscar un denominador común.${signo}`
  void m
  return {
    titulo,
    explicacion,
    conceptos: ['fracciones-multiplicacion', ...conceptos],
    regla: 'producto-fracciones',
    despues: [negativo ? neg(ids.nuevo(), intermedio) : intermedio, nodoCrudo(ids, negativo ? -rn : rn, rd)],
  }
}

function dividir(a: Crudo, b: Crudo, m: Nodo, ids: Ids): Accion {
  if (b.num === 0) {
    return {
      titulo: 'No se puede dividir entre 0',
      explicacion:
        a.num === 0
          ? '0 ÷ 0 no está definido: cualquier número multiplicado por 0 da 0, así que no hay una sola respuesta.'
          : `Dividir ${texto(a)} entre 0 no tiene respuesta: no hay ningún número que multiplicado por 0 dé ${texto(a)}.`,
      conceptos: ['enteros'],
      regla: 'division-cero',
      despues: [],
      fin: { tipo: 'no-definido', explicacion: 'Hay una división entre 0.' },
    }
  }
  const conceptos = signosDe(a, b)
  const signo = conceptos.length ? ` Los signos funcionan igual que en la multiplicación: ${nombreSigno(a, b)}.` : ''

  if (esEntero(a) && esEntero(b)) {
    const negativo = a.num < 0 !== b.num < 0 && a.num !== 0
    const p = Math.abs(a.num)
    const q = Math.abs(b.num)
    if (p % q === 0) {
      const r = (negativo ? -1 : 1) * (p / q)
      return {
        titulo: `Divide ${textoPar(a)} ÷ ${textoPar(b)}`,
        explicacion: conceptos.length
          ? `Primero divide sin fijarte en los signos: ${p} ÷ ${q} = ${p / q}.${signo} Queda ${texto({ num: r, den: 1 })}.`
          : `${p} ÷ ${q} = ${p / q}, porque ${q} · ${p / q} = ${p}.`,
        conceptos: conceptos.length ? conceptos : ['enteros'],
        regla: 'division',
        despues: [nodoEntero(ids, r)],
      }
    }
    return {
      titulo: `Divide ${textoPar(a)} ÷ ${textoPar(b)}`,
      explicacion: `${p} ÷ ${q} no es exacta, así que el resultado se escribe como fracción: ${p}/${q}.${signo}`,
      conceptos: ['fracciones-simplificar', ...conceptos],
      regla: 'division',
      despues: [nodoCrudo(ids, negativo ? -p : p, q)],
    }
  }

  // Con fracciones: se multiplica por la segunda volteada.
  const volteada = nodoCrudo(ids, b.den * Math.sign(b.num), Math.abs(b.num))
  const izq = m.tipo === 'division' ? m.izq : nodoCrudo(ids, a.num, a.den)
  return {
    titulo: 'Dividir es multiplicar por la fracción volteada',
    explicacion: esEntero(b)
      ? `Para dividir entre ${texto(b)}, multiplica por ${texto({ num: Math.sign(b.num), den: Math.abs(b.num) })}. El ${texto(b)} es lo mismo que ${texto(b)}/1, y volteado queda ${texto({ num: Math.sign(b.num), den: Math.abs(b.num) })}.`
      : `Para dividir entre ${texto(b)}, multiplica por ${texto({ num: b.den * Math.sign(b.num), den: Math.abs(b.num) })}: es la misma fracción con arriba y abajo cambiados de lugar. Solo se voltea la segunda.`,
    conceptos: ['fracciones-multiplicacion'],
    regla: 'division-fracciones',
    despues: [producto(ids.nuevo(), izq, volteada)],
  }
}

function sumarORestar(m: Nodo & { tipo: 'suma' | 'resta' }, ids: Ids, creados: Set<string>): Accion {
  const a = crudo(m.izq)!
  const b = crudo(m.der)!
  const esResta = m.tipo === 'resta'

  // 1. Signo del segundo número: a + (−b) → a − b, a − (−b) → a + b.
  if (b.num < 0) {
    const sinSigno = nodoCrudo(ids, -b.num, b.den)
    return esResta
      ? {
          titulo: 'Restar un negativo es sumar',
          explicacion: `Menos por menos da más: − (${texto(b)}) se convierte en + ${texto(abs(b))}. Piénsalo así: si te quitan una deuda de ${texto(abs(b))}, es como si te dieran ${texto(abs(b))}.`,
          conceptos: ['signos'],
          regla: 'resta-negativo',
          despues: [suma(ids.nuevo(), m.izq, sinSigno)],
        }
      : {
          titulo: 'Sumar un negativo es restar',
          explicacion: `Más por menos da menos: + (${texto(b)}) se convierte en − ${texto(abs(b))}. Sumar una deuda es lo mismo que restar.`,
          conceptos: ['signos'],
          regla: 'suma-negativo',
          despues: [resta(ids.nuevo(), m.izq, sinSigno)],
        }
  }

  // 2. Enteros.
  if (esEntero(a) && esEntero(b)) {
    const r = esResta ? a.num - b.num : a.num + b.num
    const conceptos: ConceptoId[] = a.num < 0 || r < 0 ? ['signos'] : ['enteros']
    let explicacion: string
    if (!esResta) {
      explicacion = a.num >= 0
        ? b.num === 0
          ? `Sumar 0 no cambia nada: ${a.num} + 0 = ${r}.`
          : `Si tienes ${a.num} y te dan ${b.num} más, tienes ${r}: ${a.num} + ${b.num} = ${r}.`
        : `Los signos son distintos: uno es negativo y el otro positivo. Resta los números sin fijarte en el signo, ${Math.max(-a.num, b.num)} − ${Math.min(-a.num, b.num)} = ${Math.abs(r)}, y deja el signo del que está más lejos del cero (el ${-a.num > b.num ? texto(a) : b.num}). Queda ${texto({ num: r, den: 1 })}. En la recta: empiezas en ${texto(a)} y avanzas ${b.num} hacia la derecha.`
    } else if (a.num >= 0 && a.num >= b.num) {
      explicacion = b.num === 0
        ? `Restar 0 no cambia nada: ${a.num} − 0 = ${r}.`
        : `Si tienes ${a.num} y quitas ${b.num}, te quedan ${r}: ${a.num} − ${b.num} = ${r}.`
    } else if (a.num >= 0) {
      explicacion = `A ${a.num} le quitas ${b.num}, que es más de lo que hay, así que pasas del cero: ${a.num} − ${b.num} = ${texto({ num: r, den: 1 })}. Es como tener ${a.num} y gastar ${b.num}: quedas debiendo ${-r}.`
    } else {
      explicacion = `Ya estás en ${texto(a)} y bajas ${b.num} más. Es como deber ${-a.num} y endeudarte ${b.num} más: debes ${-r}. Queda ${texto({ num: r, den: 1 })}.`
    }
    return {
      titulo: `${esResta ? 'Resta' : 'Suma'} ${texto(a)} ${esResta ? '−' : '+'} ${texto(b)}`,
      explicacion,
      conceptos,
      regla: esResta ? 'resta' : 'suma',
      despues: [nodoEntero(ids, r)],
      visual: recta(a.num, b.num, esResta),
    }
  }

  // 3. Fracciones con el mismo denominador: se suman los de arriba.
  if (a.den === b.den) {
    const r = esResta ? a.num - b.num : a.num + b.num
    const arriba = (esResta ? resta : suma)(ids.nuevo(), nodoEntero(ids, a.num), num(ids.nuevo(), b.num))
    return {
      titulo: `${esResta ? 'Resta' : 'Suma'} los numeradores`,
      explicacion: `Las dos fracciones tienen el mismo denominador (el número de abajo), ${a.den}. Entonces ${esResta ? 'restas' : 'sumas'} solo los de arriba y el de abajo se queda igual: son partes del mismo tamaño.`,
      conceptos: ['fracciones-suma', ...signosDe(a, { num: r, den: 1 })],
      regla: 'suma-fracciones',
      despues: [frac(ids.nuevo(), arriba, num(ids.nuevo(), a.den)), nodoCrudo(ids, r, a.den)],
    }
  }

  // 4. Denominadores distintos: se busca un denominador común.
  const L = mcm(a.den, b.den)
  const ka = L / a.den
  const kb = L / b.den
  const nuevaA = nodoCrudo(ids, a.num * ka, L)
  const nuevaB = nodoCrudo(ids, b.num * kb, L)
  for (const x of [nuevaA, nuevaB]) for (const y of recorrer(x)) if (y.tipo === 'frac') creados.add(y.id)
  const partes: string[] = []
  for (const [c, k] of [
    [a, ka],
    [b, kb],
  ] as const) {
    if (k === 1) continue
    partes.push(
      esEntero(c)
        ? `el ${texto(c)} es ${texto({ num: c.num * k, den: L })} (porque ${texto({ num: c.num * k, den: 1 })} ÷ ${L} = ${texto(c)})`
        : `${texto(c)} = ${texto({ num: c.num * k, den: L })} (arriba y abajo por ${k})`,
    )
  }
  const explicacion = esEntero(a) || esEntero(b)
    ? `Para ${esResta ? 'restar' : 'sumar'} un entero y una fracción, escribe el entero como fracción con el mismo denominador: ${partes.join(' y ')}. Vale lo mismo, solo cambia la forma.`
    : `Para ${esResta ? 'restar' : 'sumar'} fracciones, las dos tienen que estar en partes del mismo tamaño. El número más pequeño que se puede dividir exacto entre ${a.den} y entre ${b.den} es ${L} (el mínimo común múltiplo). Entonces: ${partes.join(' y ')}. Cada fracción vale lo mismo que antes; solo cambia la forma.`
  return {
    titulo: `Busca un denominador común: ${L}`,
    explicacion,
    conceptos: ['fracciones-suma'],
    regla: 'denominador-comun',
    despues: [(esResta ? resta : suma)(m.id, nuevaA, nuevaB)],
  }
}

/** Simplificación final del resultado: 6/8 → 3/4, 8/4 → 2. */
function simplificarFinal(m: Nodo, ids: Ids): Accion {
  const c = crudo(m)!
  if (c.den < 0) {
    return {
      titulo: 'Pasa el signo menos adelante',
      explicacion: 'Una fracción con el menos abajo vale lo mismo que con el menos adelante.',
      conceptos: ['signos'],
      regla: 'signo-denominador',
      despues: [nodoCrudo(ids, -c.num, -c.den)],
    }
  }
  const g = mcd(c.num, c.den)
  const v = Fraction.of(c.num, c.den)
  if (v.den === 1) {
    return {
      titulo: `Simplifica: ${texto(c)} = ${texto(v)}`,
      explicacion: `La raya de fracción es una división: ${Math.abs(c.num)} ÷ ${c.den} = ${Math.abs(v.num)}. Es exacta, así que el resultado es un entero.`,
      conceptos: ['fracciones-simplificar'],
      regla: 'simplificar',
      despues: [nodoEntero(ids, v.num)],
    }
  }
  return {
    titulo: `Simplifica: ${texto(c)} = ${texto(v)}`,
    explicacion: `Divide arriba y abajo entre ${g}, el número más grande que divide exacto a ${Math.abs(c.num)} y a ${c.den}. La fracción vale lo mismo, pero con números más pequeños, y ya no se puede simplificar más.`,
    conceptos: ['fracciones-simplificar'],
    regla: 'simplificar',
    despues: [nodoCrudo(ids, v.num, v.den)],
  }
}

/** "3 + 3 + 3 + 3" para 3 · 4, o "4 veces el 3" si es largo. */
function veces(a: number, b: number): string {
  if (b <= 5) return Array.from({ length: b }, () => a).join(' + ')
  if (a <= 5) return Array.from({ length: a }, () => b).join(' + ')
  return `sumar ${b} veces el ${a}`
}

const OPERACIONES: ReadonlySet<Regla> = new Set<Regla>([
  'potencia', 'producto', 'producto-fracciones', 'division', 'division-fracciones',
  'suma', 'resta', 'suma-negativo', 'resta-negativo', 'denominador-comun', 'suma-fracciones',
])
/** Después de estos pasos sigue la misma operación: no se repite el porqué del orden. */
const CONTINUA: ReadonlySet<Regla> = new Set<Regla>(['suma-negativo', 'resta-negativo', 'denominador-comun', 'division-fracciones'])

/** Los nodos de afuera hacia adentro hasta llegar a `id` (sin incluirlo). */
function ancestros(n: Nodo, id: string): Nodo[] | null {
  if (n.id === id) return []
  for (const h of hijos(n)) {
    const r = ancestros(h, id)
    if (r) return [n, ...r]
  }
  return null
}

/** Operaciones del mismo nivel: sin entrar a paréntesis, fracciones ni potencias. */
function delNivel(n: Nodo, fuera: Nodo): Nodo[] {
  const r: Nodo[] = [n]
  if (n.tipo === 'par' || n.tipo === 'frac' || n.tipo === 'pot') return n === fuera ? hijos(n).flatMap((h) => delNivel(h, fuera)) : r
  return [...r, ...hijos(n).flatMap((h) => delNivel(h, fuera))]
}

/**
 * Por qué esta operación va ahora y no otra: la jerarquía de operaciones
 * dicha en una frase. Devuelve null si no hace falta decirlo.
 */
export function porQueAhora(m: Nodo, raiz: Nodo): string | null {
  const camino = ancestros(raiz, m.id)
  if (!camino) return null
  const grupo = camino.findLast((x) => x.tipo === 'par' || x.tipo === 'frac' || x.tipo === 'pot')
  const nivel = grupo ? delNivel(grupo, grupo) : delNivel(raiz, raiz)
  const otras = nivel.filter((x) => x !== m && ['suma', 'resta', 'producto', 'division', 'pot', 'frac'].includes(x.tipo))
  const fuera = grupo ? raiz !== grupo : false
  if (grupo?.tipo === 'frac') return 'Primero se calcula lo de arriba y lo de abajo de la fracción, cada uno por separado.'
  if (grupo?.tipo === 'pot') return 'Primero se calcula lo que está en la potencia: la base y el exponente.'
  const dentro = ordenEnNivel(m, otras)
  if (grupo && fuera) return dentro ? `Primero va lo que está dentro del paréntesis, y ahí adentro: ${dentro[0].toLowerCase()}${dentro.slice(1)}` : 'Primero se resuelve lo que está dentro del paréntesis.'
  return dentro
}

function ordenEnNivel(m: Nodo, otras: Nodo[]): string | null {
  const hay = (...t: string[]) => otras.some((x) => t.includes(x.tipo))
  if (m.tipo === 'pot' && hay('suma', 'resta', 'producto', 'division', 'frac')) return 'Las potencias van antes que multiplicar, dividir, sumar o restar.'
  if (m.tipo === 'producto' || m.tipo === 'division') {
    if (hay('suma', 'resta')) return 'Multiplicar y dividir va antes que sumar y restar.'
    if (hay('producto', 'division')) return 'Entre multiplicaciones y divisiones, se va en orden de izquierda a derecha.'
  }
  if ((m.tipo === 'suma' || m.tipo === 'resta') && hay('suma', 'resta')) return 'Entre sumas y restas, se va en orden de izquierda a derecha.'
  return null
}

/** Ids del nodo nuevo, para resaltarlo en el último frame. */
const raizDe = (n: Nodo) => n.id

export function resolverAritmetica(entrada: Nodo): SolucionAritmetica {
  const ids = new Ids()
  const creados = new Set<string>()
  let actual = limpiar(entrada)
  const pasos: PasoAritmetica[] = []

  for (let vuelta = 0; vuelta < MAXIMO_PASOS; vuelta++) {
    const c = crudo(actual)
    if (c && simple(c) && !fraccionParaArreglar(actual, new Set())) {
      return { pasos, resultado: { tipo: 'valor', valor: valorDe(c) } }
    }
    const m = buscar(actual, actual, creados)
    if (!m) throw new Error('No encontré el siguiente paso')
    const a = m === actual && esLiteral(m) ? simplificarFinal(m, ids) : accion(m, ids, creados)
    const antes = actual
    const frames = [{ expr: antes, resaltar: [m.id] }]
    for (const d of a.despues) {
      actual = limpiar(reemplazar(antes, m.id, d))
      frames.push({ expr: actual, resaltar: [raizDe(d)] })
    }
    const anterior = pasos.at(-1)?.regla
    const razon = OPERACIONES.has(a.regla) && !(anterior && CONTINUA.has(anterior)) ? porQueAhora(m, antes) : null
    pasos.push({
      titulo: a.titulo,
      explicacion: razon ? `${razon} ${a.explicacion}` : a.explicacion,
      ...(a.nota ? { nota: a.nota } : {}),
      frames,
      conceptos: [...new Set(a.conceptos)],
      ...(a.visual ? { visual: a.visual } : {}),
      regla: a.regla,
    })
    if (a.fin) return { pasos, resultado: a.fin }
  }
  throw new Error('Demasiados pasos')
}
