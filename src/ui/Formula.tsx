import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Muestra una fórmula con KaTeX. `etiqueta` es lo que lee un lector de pantalla. */
export function Formula({ latex, grande = false, etiqueta }: { latex: string; grande?: boolean; etiqueta?: string }) {
  const html = useMemo(
    () => katex.renderToString(latex, { throwOnError: false, displayMode: false, output: 'html' }),
    [latex],
  )
  return (
    <span
      className={grande ? 'formula formula-grande' : 'formula'}
      role="math"
      aria-label={etiqueta ?? latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
