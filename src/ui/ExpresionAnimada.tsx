import { useId, useMemo } from 'react'
import katex from 'katex'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { recorrer, type Nodo } from '../expr/ast'
import { MACROS, textoDe, tokens, type Token } from '../expr/tokens'
import type { Frame } from '../motores/tipos'
import { curva, dur } from './movimiento'
import 'katex/dist/katex.min.css'
import './ExpresionAnimada.css'

/**
 * Dibuja un frame como tokens. Al cambiar de frame, los tokens con la misma
 * clave se deslizan a su lugar nuevo (FLIP con `layoutId` de Motion), los
 * nuevos entran con fade y los que se van salen hacia arriba.
 * Con "reducir movimiento", MotionConfig quita los desplazamientos.
 *
 * El `tex` de cada token sale del AST (tokens.ts), nunca del texto que
 * escribió la persona.
 */

const cache = new Map<string, string>()
function html(tex: string): string {
  let h = cache.get(tex)
  if (!h) {
    h = katex.renderToString(tex, { throwOnError: false, output: 'html', macros: { ...MACROS }, trust: false, strict: 'ignore' })
    cache.set(tex, h)
  }
  return h
}

/** ids de un nodo y todo lo que tiene adentro. */
function idsDentro(raiz: Nodo, ids: string[] | undefined): Set<string> {
  const r = new Set<string>()
  if (!ids?.length) return r
  for (const n of recorrer(raiz)) {
    if (ids.includes(n.id)) for (const m of recorrer(n)) r.add(m.id)
  }
  return r
}

const transicion = { layout: { duration: dur.media, ease: curva.entrada }, opacity: { duration: dur.rapida } }

type Marcas = { resaltados: Set<string>; tachados: Set<string>; grupo: string }

function Tokens({ lista, marcas }: { lista: Token[]; marcas: Marcas }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {lista.map((t) => {
        const base = t.clave.split(':')[0]
        const clase = [
          'ea-token',
          `ea-${t.tipo === 'simbolo' ? t.rol : t.tipo}`,
          marcas.resaltados.has(base) ? 'ea-resaltado' : '',
          marcas.tachados.has(base) ? 'ea-tachado' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const comun = {
          layout: 'position' as const,
          layoutId: `${marcas.grupo}-${t.clave}`,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0, y: -8 },
          transition: transicion,
          className: clase,
        }
        if (t.tipo === 'frac') {
          return (
            <motion.span key={t.clave} {...comun}>
              <span className="ea-num">
                <Tokens lista={t.num} marcas={marcas} />
              </span>
              <span className="ea-raya" />
              <span className="ea-den">
                <Tokens lista={t.den} marcas={marcas} />
              </span>
            </motion.span>
          )
        }
        if (t.tipo === 'pot') {
          return (
            <motion.span key={t.clave} {...comun}>
              <span className="ea-base">
                <Tokens lista={t.base} marcas={marcas} />
              </span>
              <span className="ea-exp">
                <Tokens lista={t.exp} marcas={marcas} />
              </span>
            </motion.span>
          )
        }
        return <motion.span key={t.clave} {...comun} dangerouslySetInnerHTML={{ __html: html(t.tex) }} />
      })}
    </AnimatePresence>
  )
}

export function ExpresionAnimada({ frame, grande = false }: { frame: Frame; grande?: boolean }) {
  const grupo = useId()
  const lista = useMemo(() => tokens(frame.expr), [frame.expr])
  const marcas = useMemo(
    () => ({ resaltados: idsDentro(frame.expr, frame.resaltar), tachados: idsDentro(frame.expr, frame.tachar), grupo }),
    [frame, grupo],
  )
  return (
    <span className={grande ? 'ea ea-grande' : 'ea'} role="math" aria-label={textoDe(frame.expr)}>
      <LayoutGroup id={grupo}>
        <span className="ea-linea" aria-hidden="true">
          <Tokens lista={lista} marcas={marcas} />
        </span>
      </LayoutGroup>
    </span>
  )
}
