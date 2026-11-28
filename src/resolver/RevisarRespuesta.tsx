import { useId, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Revision } from '../motores/tipos'
import { Marca } from '../ui/Marca'
import { dur } from '../ui/movimiento'
import { Teclado } from '../ui/Teclado'
import { aplicarTecla } from '../ui/teclado-logica'
import '../ui/Responder.css'

/**
 * "Revisar mi respuesta": el estudiante escribe lo que le dio y el motor lo
 * compara con el resultado y con los errores típicos. Sirve para el
 * problema original y para "Practicar uno igual".
 */
export function RevisarRespuesta({
  revisar,
  alVerPaso,
  despues,
  prefijo = '=',
  atajos = [],
}: {
  /** Lo que va antes del campo: "=" o "x =". */
  prefijo?: string
  /** Respuestas sin número, como "No está definido" o "No tiene solución". */
  atajos?: { texto: string; valor: string }[]
  revisar: (respuesta: string) => Revision
  /** Si se sabe en qué paso estuvo el error, se ofrece ir a ese paso. */
  alVerPaso?: (i: number) => void
  /** Botones para después de revisar, como "Ver cómo se resuelve". */
  despues?: (r: Revision) => ReactNode
}) {
  const id = useId()
  const [entrada, setEntrada] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)

  const enviar = (texto = entrada) => {
    if (revision) return
    if (texto.trim() === '') {
      setAviso('Escribe tu respuesta primero.')
      return
    }
    const r = revisar(texto)
    if (r.estado === 'invalido') {
      setAviso(r.mensaje)
      return
    }
    setAviso(null)
    setRevision(r)
  }

  const otraVez = () => {
    setRevision(null)
    setEntrada('')
  }

  const bien = revision?.estado === 'correcto' || revision?.estado === 'casi'
  const paso = revision?.estado === 'incorrecto' ? revision.paso : undefined

  return (
    <div className="resp">
      <form
        className="resp-linea"
        onSubmit={(e) => {
          e.preventDefault()
          enviar()
        }}
      >
        <label htmlFor={`${id}-r`} className="sr-only">
          Tu respuesta
        </label>
        <span className="resp-igual" aria-hidden="true">
          {prefijo}
        </span>
        <input
          id={`${id}-r`}
          className="resp-campo"
          inputMode="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="tu respuesta"
          value={entrada}
          readOnly={!!revision}
          aria-invalid={!!aviso}
          aria-describedby={aviso ? `${id}-aviso` : undefined}
          onChange={(e) => {
            setAviso(null)
            setEntrada(e.target.value.slice(0, 20))
          }}
        />
      </form>
      {aviso && (
        <p id={`${id}-aviso`} className="resp-aviso" role="alert">
          {aviso}
        </p>
      )}

      {revision ? (
        <motion.div
          className={`resp-retro ${bien ? 'resp-retro-bien' : 'resp-retro-mal'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.media }}
          role="status"
        >
          <div className="resp-retro-fila">
            <Marca tipo={bien ? 'bien' : 'mal'} />
            <p>{revision.mensaje}</p>
          </div>
          <div className="revisar-acciones">
            {paso !== undefined && alVerPaso && (
              <button type="button" className="boton boton-chico" onClick={() => alVerPaso(paso)}>
                Ver el paso {paso + 1}, donde se separó tu camino
              </button>
            )}
            {despues?.(revision)}
            {!bien && (
              <button type="button" className="boton-texto" onClick={otraVez}>
                Intentar otra vez
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          <Teclado
            alTocar={(t) => {
              setAviso(null)
              setEntrada((e) => aplicarTecla(e, t))
            }}
          />
          <div className="resp-acciones">
            <button type="button" className="boton" onClick={() => enviar()}>
              Revisar
            </button>
            {atajos.map((a) => (
              <button
                key={a.valor}
                type="button"
                className="boton boton-chico boton-secundario"
                onClick={() => {
                  setEntrada(a.valor)
                  enviar(a.valor)
                }}
              >
                {a.texto}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
