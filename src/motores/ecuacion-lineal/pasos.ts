import type { ConceptoId } from '../../content/concepts'
import { Fraction } from '../../engine/fraction'
import { recorrer, type Nodo } from '../../expr/ast'
import { frac, igual, letra as nodoLetra, neg, num, producto, resta, suma } from '../../expr/construir'
import { textoDe } from '../../expr/tokens'
import type { Paso, Resultado, Solucion, Visual } from '../tipos'
import { analizar, forma, type Ecuacion, type Lado, type Termino } from './lineal'

/** Qué hace cada paso. "Revisar mi respuesta" lo usa para señalar dónde estuvo el error. */
export type ReglaEcuacion =
  | 'quitar-parentesis'
  | 'quitar-fracciones'
  | 'juntar'
  | 'voltear'
  | 'mover-x'
  | 'mover-numero'
  | 'dividir'
  | 'cambiar-signo'
  | 'sin-x'

export type PasoEcuacion = Omit<Paso, 'regla'> & { regla: ReglaEcuacion }
export type SolucionEcuacion = Omit<Solucion, 'pasos'> & { pasos: PasoEcuacion[] }

// ── Textos ───────────────────────────────────────────────────────────────

/** −3, 3/4, −3/4 */
export function numero(v: Fraction): string {
  const s = v.num < 0 ? '−' : ''
  const a = Math.abs(v.num)
  return v.den === 1 ? `${s}${a}` : `${s}${a}/${v.den}`
}

/** 8x, −x, x/2, 3x/4, 5 */
export function termino(coef: Fraction, x: boolean, letra: string): string {
  if (!x || coef.isZero()) return numero(coef)
  const s = coef.num < 0 ? '−' : ''
  const p = Math.abs(coef.num)
  const arriba = p === 1 ? letra : `${p}${letra}`
  return coef.den === 1 ? `${s}${arriba}` : `${s}${arriba}/${coef.den}`
}

const tt = (t: Termino, l: string) => termino(t.coef, t.x, l)

/** "− 8x" o "+ 3": la operación que se hace en los dos lados. */
const sumarORestar = (t: Termino, l: string) => (t.coef.num < 0 ? `− ${termino(t.coef.neg(), t.x, l)}` : `+ ${tt(t, l)}`)

// ── Dibujar: términos → árbol con ids estables ───────────────────────────

function nodoAbs(t: Termino, l: string): Nodo {
  const p = Math.abs(t.coef.num)
  const q = t.coef.den
  if (!t.x) return q === 1 ? num(t.id, p) : frac(t.id, num(`${t.id}n`, p), num(`${t.id}d`, q))
  const letra = nodoLetra(`${t.id}x`, l)
  const arriba = p === 1 ? letra : producto(`${t.id}p`, num(`${t.id}c`, p), letra, 'implicita')
  return q === 1 ? arriba : frac(t.id, arriba, num(`${t.id}d`, q))
}

/** Todos los ids que puede tener el dibujo de un término, para resaltarlo. */
export const idsDe = (t: Termino) => [t.id, `${t.id}x`, `${t.id}p`, `${t.id}c`, `${t.id}d`, `${t.id}n`, `${t.id}-`, `o${t.id}`]

/** Se dibuja cada término tal como está, también un 0 (los pasos quitan los que ya no van). */
function nodoLado(lado: Lado, l: string, vacio: string): Nodo {
  const ts = lado
  if (!ts.length) return num(lado[0]?.id ?? vacio, 0)
  let n = nodoAbs(ts[0], l)
  if (ts[0].coef.num < 0) n = neg(`${ts[0].id}-`, n)
  for (const t of ts.slice(1)) {
    n = (t.coef.num < 0 ? resta : suma)(`o${t.id}`, n, nodoAbs(t, l))
  }
  return n
}

export const nodoEcuacion = (e: Ecuacion, l: string): Nodo => igual('eq', nodoLado(e.izq, l, 'vi'), nodoLado(e.der, l, 'vd'))

const marcar = (ts: Termino[]) => ts.flatMap(idsDe)

// ── Utilidades sobre términos ────────────────────────────────────────────

const conX = (lado: Lado) => lado.find((t) => t.x && !t.coef.isZero())
const sinX = (lado: Lado) => lado.find((t) => !t.x && !t.coef.isZero())
const vivos = (lado: Lado) => lado.filter((t) => !t.coef.isZero())

function mcm(a: number, b: number): number {
  let x = a
  let y = b
  while (y) [x, y] = [y, x % y]
  return (a / x) * b
}

/** Junta los términos con letra entre sí y los números entre sí. El id es el del primero. */
function juntar(lado: Lado): Lado {
  const r: Lado = []
  for (const t of lado) {
    const igual = r.find((u) => u.x === t.x)
    if (igual) igual.coef = igual.coef.add(t.coef)
    else r.push({ ...t })
  }
  const quedan = r.filter((t) => !t.coef.isZero())
  return quedan.length ? quedan : r.slice(0, 1).map((t) => ({ ...t, coef: Fraction.cero, x: false }))
}

const necesitaJuntar = (lado: Lado) => {
  const v = vivos(lado)
  return v.filter((t) => t.x).length > 1 || v.filter((t) => !t.x).length > 1 || (lado.length > 1 && v.length !== lado.length)
}

// ── El paso de "quitar paréntesis" ───────────────────────────────────────

const tieneLetra = (n: Nodo) => [...recorrer(n)].some((m) => m.tipo === 'var')

/** Un término ya escrito de forma simple: 3, −3, x, 3x, x/2, 3x/4, 3/4. */
function simple(n: Nodo): boolean {
  switch (n.tipo) {
    case 'num':
    case 'var':
      return true
    case 'neg':
      return n.arg.tipo !== 'neg' && simple(n.arg)
    case 'producto':
      return (n.izq.tipo === 'num' || (n.izq.tipo === 'neg' && n.izq.arg.tipo === 'num')) && n.der.tipo === 'var'
    case 'frac':
      return n.den.tipo === 'num' && n.den.valor > 1 && (n.num.tipo === 'num' || n.num.tipo === 'var' || (n.num.tipo === 'producto' && simple(n.num)))
    default:
      return false
  }
}

/** ¿El lado es una suma o resta de términos simples? */
function ladoSimple(n: Nodo): boolean {
  if (n.tipo === 'suma' || n.tipo === 'resta') return ladoSimple(n.izq) && simple(n.der) && n.der.tipo !== 'neg'
  return simple(n)
}

function explicarExpansion(ast: Nodo, l: string): { titulo: string; explicacion: string; conceptos: ConceptoId[] } {
  const partes: string[] = []
  const conceptos = new Set<ConceptoId>()
  let titulo = 'Calcula lo que es solo números'
  const lista = (n: Nodo) => {
    const an = analizar({ tipo: 'igual', id: 't', izq: n, der: { tipo: 'num', id: 't0', valor: 0 } })
    return an.ok ? textoDe(nodoLado(an.izq, l, 't')) : ''
  }
  const vistos = new Set<string>()
  for (const n of recorrer(ast)) {
    if (vistos.has(n.id)) continue
    const conPar = (m: Nodo) => m.tipo === 'par' && tieneLetra(m) && (m.arg.tipo === 'suma' || m.arg.tipo === 'resta')
    if (n.tipo === 'producto' && (conPar(n.izq) || conPar(n.der))) {
      titulo = 'Quita los paréntesis'
      partes.push(`El número de afuera multiplica a cada término de adentro, no solo al primero: ${textoDe(n)} = ${lista(n)}.`)
      for (const m of recorrer(n)) vistos.add(m.id)
      conceptos.add('jerarquia')
      conceptos.add('signos')
    } else if (n.tipo === 'neg' && conPar(n.arg)) {
      titulo = 'Quita los paréntesis'
      partes.push(`Un menos delante del paréntesis cambia el signo de cada término de adentro: ${textoDe(n)} = ${lista(n)}.`)
      for (const m of recorrer(n)) vistos.add(m.id)
      conceptos.add('signos')
    } else if (n.tipo === 'resta' && conPar(n.der)) {
      titulo = 'Quita los paréntesis'
      partes.push(`Restar un paréntesis cambia el signo de cada término de adentro: − ${textoDe(n.der)} = ${lista({ tipo: 'neg', id: 'tn', arg: n.der })}.`)
      for (const m of recorrer(n.der)) vistos.add(m.id)
      conceptos.add('signos')
    } else if ((n.tipo === 'frac' || n.tipo === 'division') && tieneLetra(n) && !simple(n)) {
      if (titulo === 'Calcula lo que es solo números') titulo = 'Reparte la fracción'
      partes.push(`Cuando arriba hay una suma, cada término se divide entre el de abajo: ${textoDe(n)} = ${lista(n)}.`)
      for (const m of recorrer(n)) vistos.add(m.id)
      conceptos.add('fracciones-suma')
    } else if (!tieneLetra(n) && n.tipo !== 'num' && !(n.tipo === 'neg' && n.arg.tipo === 'num') && !(n.tipo === 'frac' && simple(n)) && n.tipo !== 'igual') {
      partes.push(`Las operaciones que son solo números se calculan: ${textoDe(n)} = ${lista(n)}.`)
      for (const m of recorrer(n)) vistos.add(m.id)
      conceptos.add('jerarquia')
    }
  }
  if (!partes.length) partes.push('Escribe cada lado como una suma de términos sencillos, para poder juntarlos después.')
  return { titulo, explicacion: partes.join(' '), conceptos: [...conceptos, 'ecuaciones-lineales'] }
}

// ── Resolver ─────────────────────────────────────────────────────────────

const copia = (e: Ecuacion): Ecuacion => ({ izq: e.izq.map((t) => ({ ...t })), der: e.der.map((t) => ({ ...t })) })

const ATAJO_MOVER = (t: string) => `Atajo: es lo mismo que decir que el ${t} pasa al otro lado con el signo contrario. Pero lo que de verdad pasa es que haces lo mismo en los dos lados.`

export function resolverEcuacion(ast: Nodo): SolucionEcuacion {
  const an = analizar(ast)
  if (!an.ok) throw new Error(`No es una ecuación lineal: ${an.motivo}`)
  const l = an.letra
  const pasos: PasoEcuacion[] = []
  let e: Ecuacion = { izq: an.izq, der: an.der }
  const dibujo = (x: Ecuacion) => nodoEcuacion(x, l)
  const lados = (x: Ecuacion) => dibujo(x) as Extract<Nodo, { tipo: 'igual' }>
  const balanza = (antes: Ecuacion, operacion?: string, equilibrada = true): Visual => ({
    tipo: 'balanza',
    izq: lados(antes).izq,
    der: lados(antes).der,
    ...(operacion ? { operacion } : {}),
    equilibrada,
  })
  const agregar = (p: PasoEcuacion) => pasos.push(p)

  // 1. Quitar paréntesis, repartir fracciones y calcular lo que es solo números.
  if (ast.tipo === 'igual' && !(ladoSimple(ast.izq) && ladoSimple(ast.der))) {
    const x = explicarExpansion(ast, l)
    agregar({ ...x, frames: [{ expr: ast }, { expr: dibujo(e) }], regla: 'quitar-parentesis' })
  }

  // 2. Quitar fracciones: multiplicar los dos lados por el mcm de los denominadores.
  const dens = [...new Set([...e.izq, ...e.der].map((t) => t.coef.den).filter((d) => d > 1))]
  if (dens.length) {
    const m = dens.reduce(mcm, 1)
    const antes = copia(e)
    const M = Fraction.of(m)
    e = { izq: e.izq.map((t) => ({ ...t, coef: t.coef.mul(M) })), der: e.der.map((t) => ({ ...t, coef: t.coef.mul(M) })) }
    const conFraccion = [...antes.izq, ...antes.der].filter((t) => t.coef.den > 1)
    const cambios = conFraccion.map((t) => `${tt(t, l)} · ${m} = ${termino(t.coef.mul(M), t.x, l)}`).join(', ')
    const cual = dens.length === 1 ? `el número de abajo` : `el número más pequeño que se puede dividir exacto entre ${dens.join(' y ')}`
    agregar({
      titulo: `Multiplica los dos lados por ${m}`,
      explicacion: `Para quitar las fracciones, multiplica cada término de los dos lados por ${m}, ${cual}. Así ya no queda nada abajo: ${cambios}. Si multiplicas los dos platillos de la balanza por lo mismo, sigue en equilibrio.`,
      frames: [{ expr: dibujo(antes), resaltar: marcar(conFraccion) }, { expr: dibujo(e) }],
      conceptos: ['ecuaciones-lineales', 'fracciones-multiplicacion'],
      visual: balanza(antes, `· ${m}`),
      regla: 'quitar-fracciones',
    })
  }

  // 3. Juntar términos parecidos en cada lado.
  if (necesitaJuntar(e.izq) || necesitaJuntar(e.der)) {
    const antes = copia(e)
    e = { izq: juntar(e.izq), der: juntar(e.der) }
    const describir = (a: Lado, b: Lado, nombre: string) => {
      const r: string[] = []
      for (const conLetra of [true, false]) {
        const grupo = vivos(a).filter((t) => t.x === conLetra)
        if (grupo.length < 2) continue
        const total = forma(grupo)
        const v = conLetra ? total.a : total.b
        const suma = grupo.map((t, i) => (i === 0 ? tt(t, l) : sumarORestar(t, l))).join(' ')
        r.push(`${suma} = ${termino(v, conLetra, l)}${v.isZero() && conLetra ? `, así que las ${l} se cancelan` : ''}`)
      }
      if (a.length > 1 && a.some((t) => t.coef.isZero())) r.push('el 0 no cambia nada')
      void b
      return r.length ? `${nombre}: ${r.join('; ')}.` : ''
    }
    const textos = [describir(antes.izq, e.izq, 'A la izquierda'), describir(antes.der, e.der, 'A la derecha')].filter(Boolean)
    const juntados = [...antes.izq, ...antes.der].filter((t) => !t.coef.isZero())
    agregar({
      titulo: 'Junta los términos parecidos',
      explicacion: `En cada lado, junta los términos con ${l} entre sí y los números entre sí: un término con ${l} y un número solo no se pueden sumar. ${textos.join(' ')}`.trim(),
      frames: [{ expr: dibujo(antes), resaltar: marcar(juntados) }, { expr: dibujo(e) }],
      conceptos: ['ecuaciones-lineales', 'signos'],
      regla: 'juntar',
    })
  }

  // 4. Si la letra solo está a la derecha, se lee la igualdad al revés.
  if (!conX(e.izq) && conX(e.der)) {
    const antes = copia(e)
    e = { izq: e.der, der: e.izq }
    agregar({
      titulo: 'Lee la igualdad al revés',
      explicacion: `Si ${textoDe(lados(antes).izq)} es igual a lo de la derecha, lo de la derecha es igual a eso. Cambiar los lados de lugar no cambia nada y deja la ${l} a la izquierda.`,
      frames: [{ expr: dibujo(antes) }, { expr: dibujo(e) }],
      conceptos: ['ecuaciones-lineales'],
      regla: 'voltear',
    })
  }

  // 5. Llevar la letra a la izquierda: restar (o sumar) el término de la derecha en los dos lados.
  const xDer = conX(e.der)
  if (xDer) {
    const antes = copia(e)
    const op: Termino = { id: 'mx', coef: xDer.coef.neg(), x: true }
    const conOp: Ecuacion = { izq: [...e.izq, { ...op, id: 'mx1' }], der: [...e.der, { ...op, id: 'mx2' }] }
    const xIzq = conX(e.izq)!
    const nuevoCoef = xIzq.coef.add(op.coef)
    e = {
      izq: e.izq.flatMap((t) => (t === xIzq ? (nuevoCoef.isZero() ? [] : [{ ...t, coef: nuevoCoef }]) : [{ ...t }])),
      der: e.der.filter((t) => t !== xDer).map((t) => ({ ...t })),
    }
    if (!e.der.some((t) => !t.coef.isZero())) e.der = [{ id: 'vd0', coef: Fraction.cero, x: false }]
    if (nuevoCoef.isZero() && !e.izq.some((t) => !t.coef.isZero())) e.izq = [{ id: 'vi0', coef: Fraction.cero, x: false }]
    const verbo = xDer.coef.num > 0 ? 'resta' : 'suma'
    const cual = termino(xDer.coef.num > 0 ? xDer.coef : xDer.coef.neg(), true, l)
    const izqTexto = `${tt(xIzq, l)} ${sumarORestar(op, l)} = ${termino(nuevoCoef, true, l)}`
    agregar({
      titulo: `${verbo === 'resta' ? 'Resta' : 'Suma'} ${cual} en los dos lados`,
      explicacion: `Para que la ${l} quede de un solo lado, ${verbo} ${cual} en los dos lados. Si haces lo mismo en los dos platillos, la balanza sigue en equilibrio. A la derecha, ${tt(xDer, l)} ${sumarORestar(op, l)} = 0 y desaparece. A la izquierda, ${izqTexto}${nuevoCoef.isZero() ? ': ¡la ' + l + ' también se fue de este lado!' : '.'}`,
      nota: ATAJO_MOVER(tt(xDer, l)),
      frames: [
        { expr: dibujo(antes), resaltar: idsDe(xDer) },
        { expr: dibujo(conOp), resaltar: ['mx1', 'mx2'].flatMap((id) => idsDe({ ...op, id })) },
        { expr: dibujo(e) },
      ],
      conceptos: ['ecuaciones-lineales', 'signos'],
      visual: balanza(antes, `${verbo === 'resta' ? '−' : '+'} ${cual}`),
      regla: 'mover-x',
    })
  }

  // 6. Llevar los números a la derecha.
  const cIzq = sinX(e.izq)
  if (cIzq) {
    const hayX = !!conX(e.izq)
    {
      const antes = copia(e)
      const op: Termino = { id: 'mn', coef: cIzq.coef.neg(), x: false }
      const conOp: Ecuacion = { izq: [...e.izq, { ...op, id: 'mn1' }], der: [...e.der, { ...op, id: 'mn2' }] }
      const cDer = sinX(e.der)
      const nuevo = (cDer?.coef ?? Fraction.cero).add(op.coef)
      e = {
        izq: e.izq.filter((t) => t !== cIzq).map((t) => ({ ...t })),
        der: [{ id: cDer?.id ?? 'mn2', coef: nuevo, x: false }],
      }
      if (!e.izq.some((t) => !t.coef.isZero())) e.izq = [{ id: 'vi0', coef: Fraction.cero, x: false }]
      const verbo = cIzq.coef.num > 0 ? 'resta' : 'suma'
      const cual = numero(cIzq.coef.num > 0 ? cIzq.coef : cIzq.coef.neg())
      const derAntes = numero(cDer?.coef ?? Fraction.cero)
      agregar({
        titulo: `${verbo === 'resta' ? 'Resta' : 'Suma'} ${cual} en los dos lados`,
        explicacion: hayX
          ? `Para dejar sola la parte con ${l}, ${verbo} ${cual} en los dos lados. A la izquierda, ${numero(cIzq.coef)} ${sumarORestar(op, l)} = 0. A la derecha, ${derAntes} ${sumarORestar(op, l)} = ${numero(nuevo)}. La balanza sigue en equilibrio porque cambiaste los dos lados igual.`
          : `Ya no hay ${l}. Para ver qué queda, ${verbo} ${cual} en los dos lados: a la izquierda queda 0 y a la derecha ${derAntes} ${sumarORestar(op, l)} = ${numero(nuevo)}.`,
        nota: ATAJO_MOVER(numero(cIzq.coef)),
        frames: [
          { expr: dibujo(antes), resaltar: idsDe(cIzq) },
          { expr: dibujo(conOp), resaltar: ['mn1', 'mn2'].flatMap((id) => idsDe({ ...op, id })) },
          { expr: dibujo(e) },
        ],
        conceptos: ['ecuaciones-lineales', 'signos'],
        visual: balanza(antes, `${verbo === 'resta' ? '−' : '+'} ${cual}`),
        regla: 'mover-numero',
      })
    }
  }

  // 7. Sin letra: no hay solución, o cualquier número sirve.
  const xFinal = conX(e.izq)
  if (!xFinal) {
    const izq = forma(e.izq).b
    const der = forma(e.der).b
    const cierto = izq.equals(der)
    const resultado: Resultado = cierto ? { tipo: 'infinitas' } : { tipo: 'sin-solucion' }
    agregar({
      titulo: cierto ? 'Siempre se cumple' : 'Nunca se cumple',
      explicacion: cierto
        ? `La ${l} se canceló y quedó ${numero(izq)} = ${numero(der)}, que siempre es cierto. No importa qué número pongas en lugar de la ${l}: los dos lados siempre quedan iguales. Por eso la ecuación tiene infinitas soluciones: cualquier número sirve.`
        : `La ${l} se canceló y quedó ${numero(izq)} = ${numero(der)}, que es falso: ${numero(izq)} nunca es igual a ${numero(der)}. No importa qué número pongas en lugar de la ${l}: los dos lados nunca quedan iguales. Por eso la ecuación no tiene solución.`,
      frames: [{ expr: dibujo(e) }],
      conceptos: ['ecuaciones-lineales'],
      visual: balanza(e, undefined, cierto),
      regla: 'sin-x',
    })
    return { pasos, resultado }
  }

  // 8. Dejar la letra sola: dividir entre el número que la multiplica.
  const a = xFinal.coef
  const d = forma(e.der).b
  const valor = d.div(a)
  const cDer = sinX(e.der) ?? e.der[0]
  const derId = cDer?.id ?? 'vd0'
  if (!a.equals(Fraction.uno)) {
    const antes = copia(e)
    const despues: Ecuacion = { izq: [{ ...xFinal, coef: Fraction.uno }], der: [{ id: derId, coef: valor, x: false }] }
    if (a.equals(Fraction.of(-1))) {
      e = despues
      agregar({
        titulo: 'Cambia el signo de los dos lados',
        explicacion: `${tt(xFinal, l)} = ${numero(d)} dice que el opuesto de ${l} es ${numero(d)}. Entonces ${l} es el opuesto de ${numero(d)}: ${l} = ${numero(valor)}. Es lo mismo que multiplicar los dos lados por −1.`,
        frames: [{ expr: dibujo(antes), resaltar: idsDe(xFinal) }, { expr: dibujo(e) }],
        conceptos: ['ecuaciones-lineales', 'signos'],
        visual: balanza(antes, '· (−1)'),
        regla: 'cambiar-signo',
      })
    } else {
      const dib = lados(antes)
      const divisor = (id: string) => (a.num < 0 ? neg(`${id}-`, num(id, -a.num)) : num(id, a.num))
      const conDivision = igual('eq', frac('dv1', dib.izq, divisor('dv1d')), frac('dv2', dib.der, divisor('dv2d')))
      e = despues
      const exacta = valor.isInteger()
      agregar({
        titulo: `Divide los dos lados entre ${numero(a)}`,
        explicacion: `La ${l} está multiplicada por ${numero(a)}. Para dejarla sola, divide los dos lados entre ${numero(a)}: a la izquierda ${tt(xFinal, l)} ÷ ${a.num < 0 ? `(${numero(a)})` : numero(a)} = ${l}, y a la derecha ${numero(d)} ÷ ${a.num < 0 ? `(${numero(a)})` : numero(a)} = ${numero(valor)}.${exacta ? '' : ' La división no es exacta, así que queda como fracción simplificada.'} Los dos lados se dividen igual, así que la balanza sigue en equilibrio.`,
        nota: `Atajo: es lo mismo que decir que el ${numero(a)}, que multiplica, pasa al otro lado dividiendo. Fíjate que no cambia de signo.`,
        frames: [{ expr: dibujo(antes), resaltar: idsDe(xFinal) }, { expr: conDivision, resaltar: ['dv1d', 'dv2d', 'dv1d-', 'dv2d-'] }, { expr: dibujo(e) }],
        conceptos: ['ecuaciones-lineales', 'fracciones-simplificar'],
        visual: balanza(antes, `÷ ${a.num < 0 ? `(${numero(a)})` : numero(a)}`),
        regla: 'dividir',
      })
    }
  }

  return { pasos, resultado: { tipo: 'solucion', variable: l, valor } }
}

/** El problema con la letra reemplazada por un número, para mostrar la comprobación. */
export function sustituir(n: Nodo, letra: string, v: Fraction): Nodo {
  let k = 0
  const valor = (): Nodo => {
    const id = `s${k++}`
    const a = Math.abs(v.num)
    const base: Nodo = v.den === 1 ? num(`${id}n`, a) : frac(`${id}f`, num(`${id}n`, a), num(`${id}d`, v.den))
    // Entre paréntesis si es negativo o fracción: 3(−2), no 3−2.
    const conSigno: Nodo = v.num < 0 ? neg(`${id}s`, base) : base
    return v.num < 0 || v.den !== 1 ? { tipo: 'par', id, arg: conSigno } : conSigno
  }
  const rec = (m: Nodo): Nodo => {
    switch (m.tipo) {
      case 'var':
        return m.nombre === letra ? valor() : m
      case 'num':
      case 'mixto':
        return m
      case 'neg':
      case 'par':
        return { ...m, arg: rec(m.arg) }
      case 'frac':
        return { ...m, num: rec(m.num), den: rec(m.den) }
      case 'pot':
        return { ...m, base: rec(m.base), exp: rec(m.exp) }
      case 'producto': {
        const izq = rec(m.izq)
        const der = rec(m.der)
        // 3x con x = 2 se escribe 3 · 2, no 32.
        return { ...m, izq, der, forma: m.forma === 'implicita' && m.der.tipo === 'var' ? 'punto' : m.forma }
      }
      default:
        return { ...m, izq: rec(m.izq), der: rec(m.der) }
    }
  }
  return rec(n)
}

