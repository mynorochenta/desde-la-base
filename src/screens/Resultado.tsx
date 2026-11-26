import { conceptos } from '../content/concepts'
import { estadosMapa, rutaRecomendada, type EstadoMapa } from '../diagnostic/machine'
import { href, rutas } from '../router'
import { useProgreso } from '../storage/progress'
import { MapaConceptos, MuestraEstado } from '../ui/MapaConceptos'
import './Resultado.css'

const LEYENDA: Array<{ estado: EstadoMapa; texto: string }> = [
  { estado: 'dominado', texto: 'Ya lo dominas' },
  { estado: 'siguiente', texto: 'Te falta y ya puedes aprenderlo' },
  { estado: 'bloqueado', texto: 'Necesitas lo de abajo primero' },
]

export function Resultado() {
  const progreso = useProgreso()
  const diag = progreso.diagnostico

  if (!diag) {
    return (
      <main className="hoja resultado">
        <h1 className="resultado-titulo">Tu mapa</h1>
        <p className="resultado-texto">Haz el diagnóstico para ver qué bases dominas y por dónde empezar.</p>
        <a className="boton" href={href(rutas.diagnostico)}>
          Empezar el diagnóstico
        </a>
      </main>
    )
  }

  // Lo aprendido en lecciones cuenta aunque el diagnóstico dijera otra cosa.
  const v = { ...diag.veredictos }
  for (const [id, c] of Object.entries(progreso.conceptos)) if (c.dominado) v[id] = 'dominado'

  const estados = estadosMapa(v)
  const ruta = rutaRecomendada(v)
  const total = Object.keys(conceptos).length
  const dominados = total - ruta.length
  const inicio = ruta[0] ?? null

  return (
    <main className="hoja resultado">
      <a className="boton-texto resultado-volver" href={href(rutas.inicio)}>
        Inicio
      </a>
      <h1 className="resultado-titulo">Tu mapa</h1>
      <p className="resultado-texto">
        {!inicio
          ? 'Dominas todas las bases de esta parte. Muy bien.'
          : dominados === 0
            ? `Vamos a empezar desde el principio, con ${conceptos[inicio].nombre.toLowerCase()}. Así nada te queda flojo.`
            : `Dominas ${dominados} de ${total} bases. Tu punto de partida es ${conceptos[inicio].nombre.toLowerCase()}.`}
      </p>

      <MapaConceptos estados={estados} inicio={inicio} />

      <ul className="leyenda">
        {LEYENDA.map((l) => (
          <li key={l.estado}>
            <MuestraEstado estado={l.estado} />
            {l.texto}
          </li>
        ))}
      </ul>

      {ruta.length > 0 && (
        <section className="ruta" aria-labelledby="ruta-titulo">
          <h2 id="ruta-titulo">Tu ruta</h2>
          <p className="ruta-intro">En este orden, cada tema te prepara para el siguiente.</p>
          <ol>
            {ruta.map((id, i) => {
              const c = conceptos[id]
              return (
                <li key={id} className={i === 0 ? 'ruta-paso ruta-actual' : 'ruta-paso'}>
                  <span className="ruta-numero" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{c.nombre}</h3>
                    <p>{c.resumen}</p>
                    {i === 0 &&
                      (c.leccion ? (
                        <a className="boton boton-chico" href={href(rutas.leccion(c.leccion))}>
                          Empezar la lección
                        </a>
                      ) : (
                        <p className="ruta-pronto">Esta lección está en preparación.</p>
                      ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <a className="boton-texto resultado-repetir" href={href(rutas.diagnostico)}>
        Repetir el diagnóstico
      </a>
    </main>
  )
}
