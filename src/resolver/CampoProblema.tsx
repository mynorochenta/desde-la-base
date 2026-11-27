import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { leerProblema } from '../expr/parse'
import { latexDe } from '../expr/tokens'
import type { MathfieldElement } from 'mathlive'
import './CampoProblema.css'

/**
 * Campo para escribir el problema. Empieza como un campo de texto simple,
 * que siempre funciona, y cambia a MathLive cuando termina de cargar.
 * Si MathLive no carga a tiempo (conexión lenta) o falla, se queda el
 * campo de texto.
 */

const ESPERA_MAXIMA = 8000

type Modo = 'texto' | 'mathlive'
type Carga = 'cargando' | 'lista' | 'fallo'

let promesa: Promise<typeof import('./mathlive')> | null = null
const cargar = () => (promesa ??= import('./mathlive'))

export function CampoProblema({
  inicial,
  alEnviar,
  id,
}: {
  inicial: string
  alEnviar: (problema: string) => void
  id: string
}) {
  const [modo, setModo] = useState<Modo>('texto')
  const [carga, setCarga] = useState<Carga>('cargando')
  const [texto, setTexto] = useState(inicial)
  const valor = useRef(inicial)
  const caja = useRef<HTMLDivElement>(null)
  const campo = useRef<MathfieldElement | null>(null)
  // Si el problema que llega no se puede leer, se queda en texto para poder corregirlo.
  const tocado = useRef(inicial.trim() !== '' && !leerProblema(inicial).ok)
  const enviar = useRef(alEnviar)
  useLayoutEffect(() => {
    enviar.current = alEnviar
  })

  // Carga MathLive una vez; si tarda demasiado, se queda el texto.
  useEffect(() => {
    let vivo = true
    const reloj = window.setTimeout(() => vivo && setCarga((c) => (c === 'cargando' ? 'fallo' : c)), ESPERA_MAXIMA)
    cargar()
      .then(() => {
        if (!vivo) return
        setCarga((c) => (c === 'fallo' ? c : 'lista'))
        // Si la persona ya empezó a escribir en el texto, no le cambiamos el campo.
        if (!tocado.current) setModo('mathlive')
      })
      .catch(() => vivo && setCarga('fallo'))
    return () => {
      vivo = false
      window.clearTimeout(reloj)
    }
  }, [])

  // Crea el math-field cuando toca.
  useEffect(() => {
    if (modo !== 'mathlive' || !caja.current) return
    let quitar = () => {}
    let vivo = true
    cargar().then(({ MathfieldElement, macros }) => {
      if (!vivo || !caja.current) return
      const mf = new MathfieldElement()
      mf.id = id
      mf.setAttribute('aria-label', 'Escribe tu problema')
      // MathLive pide estar en la página antes de recibir opciones y valor.
      caja.current.appendChild(mf)
      mf.macros = { ...mf.macros, ...macros }
      mf.smartMode = false
      mf.mathVirtualKeyboardPolicy = 'auto'
      // Solo pasa a MathLive lo que el parser entendió y regeneró: nunca el texto crudo.
      const l = leerProblema(valor.current)
      mf.value = l.ok ? latexDe(l.ast) : ''
      const alEscribir = () => {
        valor.current = mf.getValue('latex')
      }
      const alTecla = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          enviar.current(mf.getValue('latex'))
        }
      }
      mf.addEventListener('input', alEscribir)
      mf.addEventListener('keydown', alTecla)
      campo.current = mf
      quitar = () => {
        mf.removeEventListener('input', alEscribir)
        mf.removeEventListener('keydown', alTecla)
        mf.remove()
        campo.current = null
      }
    })
    return () => {
      vivo = false
      quitar()
    }
  }, [modo, id])

  const aTexto = () => {
    // El texto que ve la persona: lo que escribió en MathLive, como LaTeX.
    setTexto(valor.current)
    tocado.current = true
    setModo('texto')
  }

  return (
    <form
      className="campo"
      onSubmit={(e) => {
        e.preventDefault()
        enviar.current(modo === 'texto' ? texto : (campo.current?.getValue('latex') ?? valor.current))
      }}
    >
      {modo === 'texto' ? (
        <input
          id={id}
          className="campo-texto"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Por ejemplo: 3/4 + 5/6"
          value={texto}
          onChange={(e) => {
            tocado.current = true
            valor.current = e.target.value
            setTexto(e.target.value)
          }}
        />
      ) : (
        <div className="campo-math" ref={caja} />
      )}

      <div className="campo-acciones">
        <button type="submit" className="boton">
          Resolver
        </button>
        {modo === 'mathlive' ? (
          <button type="button" className="boton-texto" onClick={aTexto}>
            Escribir como texto
          </button>
        ) : carga === 'lista' ? (
          <button
            type="button"
            className="boton-texto"
            onClick={() => {
              valor.current = texto
              setModo('mathlive')
            }}
          >
            Usar el editor matemático
          </button>
        ) : null}
      </div>

      {modo === 'mathlive' && (
        <p className="campo-ayuda">
          Con el teclado de la computadora: escribe / para una fracción y usa la flecha → para salir de ella. Enter resuelve.
        </p>
      )}

      {modo === 'texto' && (
        <p className="campo-ayuda">
          {carga === 'fallo'
            ? 'El editor matemático no cargó, pero puedes escribir aquí. '
            : carga === 'cargando'
              ? 'Cargando el editor matemático… Mientras, puedes escribir aquí. '
              : ''}
          Usa / para fracciones, * para multiplicar, ^ para potencias y paréntesis cuando haga falta.
        </p>
      )}
    </form>
  )
}
