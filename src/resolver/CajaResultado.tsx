import { f, type Fraction } from '../engine/fraction'
import { variables, type Nodo } from '../expr/ast'
import { frac, neg, num } from '../expr/construir'
import { evaluar } from '../expr/evaluar'
import { sustituir } from '../expr/sustituir'
import type { Resultado } from '../motores/tipos'
import { ExpresionAnimada } from '../ui/ExpresionAnimada'

/** Un valor exacto como árbol, para dibujarlo: −3/4 → neg(frac(3, 4)). */
function nodoValor(v: Fraction, id = 'r'): Nodo {
  const a = Math.abs(v.num)
  const n = v.den === 1 ? num(`${id}n`, a) : frac(`${id}f`, num(`${id}n`, a), num(`${id}d`, v.den))
  return v.num < 0 ? neg(`${id}s`, n) : n
}

/** −3/4 → "−3/4" */
const texto = (v: Fraction) => `${v.num < 0 ? '−' : ''}${Math.abs(v.num)}${v.den === 1 ? '' : `/${v.den}`}`

/** 19/12 → "1 7/12" (solo si la fracción es mayor que 1). */
function comoMixto(v: Fraction): string | null {
  const a = Math.abs(v.num)
  if (v.den === 1 || a < v.den) return null
  return `${v.num < 0 ? '−' : ''}${Math.floor(a / v.den)} ${a % v.den}/${v.den}`
}

/**
 * La comprobación que ve el estudiante: el número en lugar de la letra en la
 * ecuación original, y cuánto da cada lado. La hace el evaluador, aparte
 * del motor.
 */
function Sustitucion({ ecuacion, letra, valor }: { ecuacion: Nodo & { tipo: 'igual' }; letra: string; valor: Fraction }) {
  const vars = { [letra]: valor }
  const a = evaluar(ecuacion.izq, vars)
  const b = evaluar(ecuacion.der, vars)
  if (!a.ok || !b.ok) return null
  const iguales = a.valor.equals(b.valor)
  return (
    <div className="solucion-sustitucion">
      <p>
        Con {letra} = {texto(valor)}:
      </p>
      <div className="solucion-problema">
        <ExpresionAnimada frame={{ expr: sustituir(ecuacion, letra, valor) }} />
      </div>
      <p>
        La izquierda da {texto(a.valor)} y la derecha da {texto(b.valor)}.{' '}
        {iguales ? <strong className="solucion-si">Dan lo mismo ✓</strong> : <strong className="solucion-no">No dan lo mismo ✗</strong>}
      </p>
    </div>
  )
}

export function CajaResultado({ resultado, expr }: { resultado: Resultado; expr: Nodo }) {
  if (resultado.tipo === 'no-definido') {
    return (
      <div className="solucion-resultado">
        <p className="solucion-resultado-titulo">Resultado</p>
        <p className="solucion-resultado-valor">No está definido</p>
        <p>{resultado.explicacion} Dividir entre 0 no tiene respuesta, así que el problema no tiene resultado.</p>
      </div>
    )
  }

  if (resultado.tipo === 'valor') {
    const mixto = comoMixto(resultado.valor)
    return (
      <div className="solucion-resultado">
        <p className="solucion-resultado-titulo">Resultado</p>
        <div className="solucion-resultado-valor">
          <ExpresionAnimada frame={{ expr: nodoValor(resultado.valor) }} grande />
        </div>
        {mixto && <p>Como número mixto: {mixto}</p>}
        <p className="solucion-comprobado">
          <span aria-hidden="true">✓</span> Comprobado: calculé el resultado otra vez por otro camino y coincide.
        </p>
      </div>
    )
  }

  if (expr.tipo !== 'igual') return null
  const letra = resultado.tipo === 'solucion' ? resultado.variable : (variables(expr)[0] ?? 'x')

  if (resultado.tipo === 'solucion') {
    const mixto = comoMixto(resultado.valor)
    return (
      <div className="solucion-resultado">
        <p className="solucion-resultado-titulo">Solución</p>
        <div className="solucion-resultado-valor">
          <ExpresionAnimada frame={{ expr: { tipo: 'igual', id: 'rs', izq: { tipo: 'var', id: 'rx', nombre: letra }, der: nodoValor(resultado.valor) } }} grande />
        </div>
        {mixto && <p>Como número mixto: {mixto}</p>}
        <p>Tiene una sola solución: solo ese número hace que los dos lados den lo mismo.</p>
        <h3 className="solucion-resultado-titulo">Compruébalo</h3>
        <p>Pon el número en lugar de la {letra} en la ecuación que escribiste y calcula cada lado:</p>
        <Sustitucion ecuacion={expr} letra={letra} valor={resultado.valor} />
      </div>
    )
  }

  const infinitas = resultado.tipo === 'infinitas'
  // Dos ejemplos: con infinitas, los dos funcionan; sin solución, ninguno.
  const ejemplos = [0, 5].map((n) => ({ n, v: f(n) }))
  return (
    <div className="solucion-resultado">
      <p className="solucion-resultado-titulo">Resultado</p>
      <p className="solucion-resultado-valor">{infinitas ? 'Infinitas soluciones' : 'No tiene solución'}</p>
      <p>
        {infinitas
          ? `Cualquier número sirve: pongas lo que pongas en lugar de la ${letra}, los dos lados dan lo mismo.`
          : `Ningún número sirve: pongas lo que pongas en lugar de la ${letra}, los dos lados nunca dan lo mismo.`}
      </p>
      <h3 className="solucion-resultado-titulo">Compruébalo con dos números</h3>
      {ejemplos.map((e) => (
        <Sustitucion key={e.n} ecuacion={expr} letra={letra} valor={e.v} />
      ))}
    </div>
  )
}
