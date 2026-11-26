import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { urlReporte } from '../config/reportes'
import type { Ejercicio } from '../engine/types'

/** Enlace discreto para avisar que un ejercicio está mal. Abre el formulario externo con los datos llenos. */
export function ReportarError({ ejercicio, respuesta }: { ejercicio: Ejercicio; respuesta: string }) {
  const [abierto, setAbierto] = useState(false)
  const [comentario, setComentario] = useState('')
  const id = useId()

  const enviar = () => {
    window.open(urlReporte(ejercicio, respuesta, comentario), '_blank', 'noopener,noreferrer')
    setAbierto(false)
    setComentario('')
  }

  return (
    <div className="reporte">
      <button type="button" className="boton-texto reporte-enlace" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        Reportar un error en este ejercicio
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            className="reporte-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label htmlFor={id}>¿Qué crees que está mal?</label>
            <textarea
              id={id}
              rows={3}
              maxLength={500}
              value={comentario}
              placeholder="La respuesta correcta debería ser 5, no 6"
              onChange={(e) => setComentario(e.target.value)}
            />
            <p className="reporte-nota">Se abre un formulario con este ejercicio ya escrito. No se envía nada tuyo.</p>
            <button type="button" className="boton boton-chico" onClick={enviar}>
              Enviar reporte
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
