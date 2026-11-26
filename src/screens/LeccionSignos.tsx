import { useState } from 'react'
import { motion } from 'motion/react'
import { conceptos, type ConceptoId } from '../content/concepts'
import { completarLeccion, guardarPaso } from '../lessons/leccion'
import { CONCEPTO, LECCION_ID, PASOS, PRACTICA, PRUEBA } from '../lessons/ley-de-signos/contenido'
import { PasoProducto, PasoSuma } from '../lessons/ley-de-signos/Exploradores'
import { PasoEjemplo } from '../lessons/ley-de-signos/PasoEjemplo'
import { PasoEjercicios } from '../lessons/ley-de-signos/PasoEjercicios'
import { href, rutas } from '../router'
import { actualizarProgreso, useProgreso } from '../storage/progress'
import { Marca } from '../ui/Marca'
import '../lessons/ley-de-signos/leccion.css'

type Fin = { aciertos: number; paso: boolean; desbloqueados: ConceptoId[] }

function Pasos({ actual, alcanzado, alElegir }: { actual: number; alcanzado: number; alElegir: (i: number) => void }) {
  return (
    <nav className="pasos" aria-label="Pasos de la lección">
      <ol>
        {PASOS.map((p, i) => {
          const estado = i === actual ? 'pasos-actual' : i < alcanzado || i < actual ? 'pasos-hecho' : 'pasos-futuro'
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`pasos-punto ${estado}`}
                disabled={i > alcanzado}
                aria-current={i === actual ? 'step' : undefined}
                aria-label={`Paso ${i + 1}: ${p.titulo}`}
                onClick={() => alElegir(i)}
              >
                {i + 1}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="pasos-texto">
        Paso {actual + 1} de {PASOS.length}: {PASOS[actual].titulo}
      </p>
    </nav>
  )
}

function Resultado({ fin, alReintentar, alPracticar }: { fin: Fin; alReintentar: () => void; alPracticar: () => void }) {
  if (!fin.paso) {
    return (
      <section className="paso fin" aria-labelledby="fin-titulo">
        <h1 id="fin-titulo" className="paso-titulo">
          Acertaste {fin.aciertos} de {PRUEBA.cantidad}
        </h1>
        <p className="paso-texto">
          Para pasar necesitas {PRUEBA.paraPasar}.{' '}
          {fin.aciertos >= PRUEBA.paraPasar - 2 ? 'Te falta poco. ' : 'Conviene repasar los pasos de la recta y practicar otra vez. '}
          Cuando quieras, vuelve a intentarlo: los números cambian cada vez.
        </p>
        <div className="paso-acciones">
          <button type="button" className="boton" onClick={alReintentar}>
            Intentar otra vez
          </button>
          <button type="button" className="boton boton-secundario" onClick={alPracticar}>
            Practicar más
          </button>
        </div>
      </section>
    )
  }
  return (
    <section className="paso fin" aria-labelledby="fin-titulo">
      <div className="fin-marca">
        <Marca tipo="bien" />
      </div>
      <h1 id="fin-titulo" className="paso-titulo">
        Ya dominas la ley de signos
      </h1>
      <p className="paso-texto">
        Acertaste {fin.aciertos} de {PRUEBA.cantidad}. Quedó guardado en tu mapa.
      </p>
      {fin.desbloqueados.length > 0 && (
        <motion.div className="fin-desbloqueo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2>Ahora puedes aprender</h2>
          <ul>
            {fin.desbloqueados.map((id) => (
              <li key={id}>
                <strong>{conceptos[id].nombre}.</strong> {conceptos[id].resumen}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      <div className="paso-acciones">
        <a className="boton" href={href(rutas.resultado)}>
          Ver tu mapa
        </a>
        <a className="boton-texto" href={href(rutas.inicio)}>
          Volver al inicio
        </a>
      </div>
    </section>
  )
}

export function LeccionSignos() {
  const progreso = useProgreso()
  const guardada = progreso.lecciones[LECCION_ID]
  const ultimo = PASOS.length - 1
  const alcanzado = guardada?.completada ? ultimo : Math.min(ultimo, guardada?.paso ?? 0)
  const [paso, setPaso] = useState(() => (guardada?.completada ? 0 : alcanzado))
  const [fin, setFin] = useState<Fin | null>(null)
  // Cambia para que la práctica o la prueba empiecen con números nuevos.
  const [intento, setIntento] = useState(0)

  const ir = (i: number) => {
    setPaso(i)
    setFin(null)
    setIntento((n) => n + 1)
    actualizarProgreso((p) => guardarPaso(p, LECCION_ID, i))
    window.scrollTo(0, 0)
  }

  const terminarPrueba = (aciertos: number) => {
    const pasa = aciertos >= PRUEBA.paraPasar
    let desbloqueados: ConceptoId[] = []
    if (pasa) {
      actualizarProgreso((p) => {
        const r = completarLeccion(p, LECCION_ID, CONCEPTO, ultimo)
        desbloqueados = r.desbloqueados
        return r.progreso
      })
    }
    setFin({ aciertos, paso: pasa, desbloqueados })
    window.scrollTo(0, 0)
  }

  const id = PASOS[paso].id
  return (
    <main className="hoja leccion">
      <div className="leccion-barra">
        <a className="boton-texto leccion-salir" href={href(rutas.inicio)}>
          Salir
        </a>
        <span className="leccion-nombre">Ley de signos</span>
      </div>
      <Pasos actual={paso} alcanzado={alcanzado} alElegir={ir} />

      <motion.div key={`${paso}-${intento}-${fin ? 'fin' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {fin ? (
          <Resultado fin={fin} alReintentar={() => ir(ultimo)} alPracticar={() => ir(ultimo - 1)} />
        ) : id === 'recta-suma' ? (
          <PasoSuma alSeguir={() => ir(1)} />
        ) : id === 'recta-producto' ? (
          <PasoProducto alSeguir={() => ir(2)} />
        ) : id === 'ejemplo' ? (
          <PasoEjemplo alSeguir={() => ir(3)} />
        ) : id === 'practica' ? (
          <PasoEjercicios
            titulo="Práctica"
            texto="Resuelve con calma. Si te equivocas, te decimos en qué y puedes verlo en la recta."
            cantidad={PRACTICA.cantidad}
            textoFinal="Ir a la mini prueba"
            alTerminar={() => ir(4)}
          />
        ) : (
          <PasoEjercicios
            titulo="Mini prueba"
            texto={`Son ${PRUEBA.cantidad} ejercicios. Con ${PRUEBA.paraPasar} bien, desbloqueas los temas que siguen.`}
            cantidad={PRUEBA.cantidad}
            textoFinal="Ver mi resultado"
            alTerminar={terminarPrueba}
          />
        )}
      </motion.div>
    </main>
  )
}
