import { useMemo } from 'react'
import { conceptos } from '../content/concepts'
import { leerProblema, type Lectura } from '../expr/parse'
import { temaCercano } from '../motores/cercano'
import { despachar } from '../motores/registro'
import { href, rutas, useUbicacion } from '../router'
import { ExpresionAnimada } from '../ui/ExpresionAnimada'
import './Solucion.css'

/**
 * La solución de un problema que llega en la ruta (?p=).
 *
 * Seguridad: `p` es texto no confiable (cualquiera puede armar un enlace).
 * Solo se dibuja lo que el parser entendió, regenerado desde el AST. Si no
 * se puede leer, se muestra tal cual como texto plano: React lo escapa.
 */

function VolverAEscribir({ problema, texto = 'Corregir el problema' }: { problema: string; texto?: string }) {
  return (
    <a className="boton-texto" href={href(rutas.escribir(problema))}>
      {texto}
    </a>
  )
}

/** "No sé si es 1½ o 1 · ½": se le pregunta al estudiante. */
function PreguntaMixto({ error }: { error: Extract<Lectura, { ok: false }>['error'] & { tipo: 'mixto-ambiguo' } }) {
  const opciones = [
    { problema: error.comoMixto, texto: `Es un número mixto: ${error.entero} y ${error.num}/${error.den}` },
    { problema: error.comoProducto, texto: `Es una multiplicación: ${error.entero} por ${error.num}/${error.den}` },
  ]
  return (
    <section className="solucion-bloque" aria-labelledby="mixto-t">
      <h2 id="mixto-t" className="solucion-subtitulo">
        ¿Qué quisiste escribir?
      </h2>
      <p>{error.mensaje}</p>
      <ul className="solucion-opciones">
        {opciones.map((o) => {
          const l = leerProblema(o.problema)
          return (
            <li key={o.problema}>
              <a className="solucion-opcion" href={href(rutas.resolver(o.problema))}>
                <span>{o.texto}</span>
                {l.ok && <ExpresionAnimada frame={{ expr: l.ast }} />}
              </a>
            </li>
          )
        })}
      </ul>
      <p className="solucion-nota">Para escribir un número mixto, usa la tecla 1½ del teclado matemático.</p>
    </section>
  )
}

export function Solucion() {
  const problema = useUbicacion().params.get('p') ?? ''
  const lectura = useMemo(() => leerProblema(problema), [problema])
  const despacho = useMemo(() => (lectura.ok ? despachar(lectura.ast) : null), [lectura])

  if (!lectura.ok) {
    const e = lectura.error
    return (
      <main className="hoja hoja-ancha solucion">
        {e.tipo === 'mixto-ambiguo' ? (
          <PreguntaMixto error={e} />
        ) : (
          <section className="solucion-bloque" aria-labelledby="error-t">
            <h1 id="error-t" className="solucion-titulo">
              No pude leer tu problema
            </h1>
            {problema.trim() !== '' && (
              <p className="solucion-crudo">
                Escribiste: <code>{problema.slice(0, 300)}</code>
              </p>
            )}
            <p className="solucion-error">{e.mensaje}</p>
          </section>
        )}
        <VolverAEscribir problema={problema} />
      </main>
    )
  }

  const tema = temaCercano(lectura.ast)
  const leccion = conceptos[tema].leccion

  return (
    <main className="hoja hoja-ancha solucion">
      <section className="solucion-bloque" aria-labelledby="entendi-t">
        <h1 id="entendi-t" className="solucion-subtitulo">
          Así entendí tu problema
        </h1>
        <div className="solucion-problema">
          <ExpresionAnimada frame={{ expr: lectura.ast }} grande />
        </div>
        {lectura.avisos.map((a) => (
          <p key={a.id} className="solucion-aviso">
            {a.mensaje}
          </p>
        ))}
        <VolverAEscribir problema={problema} texto="No es eso: corregirlo" />
      </section>

      {despacho?.estado === 'resuelto' ? (
        <section className="solucion-bloque" aria-labelledby="pasos-t">
          <h2 id="pasos-t" className="solucion-subtitulo">
            Paso a paso
          </h2>
          <ol className="solucion-pasos">
            {despacho.solucion.pasos.map((p, i) => (
              <li key={i}>
                <strong>{p.titulo}</strong>
                <p>{p.explicacion}</p>
                <ExpresionAnimada frame={p.frames[p.frames.length - 1]} />
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="solucion-bloque" aria-labelledby="no-t">
          <h2 id="no-t" className="solucion-subtitulo">
            {despacho?.estado === 'no-verificado' ? 'No pude comprobar el resultado' : 'Todavía no sé resolver este tipo de problema'}
          </h2>
          <p>
            {despacho?.estado === 'no-verificado'
              ? 'Lo reconocí, pero mi resultado no pasó la comprobación, así que no te lo muestro.'
              : 'Prefiero decírtelo antes que darte un resultado que no puedo explicar.'}{' '}
            El tema más cercano es <strong>{conceptos[tema].nombre}</strong>.
          </p>
          <div className="solucion-acciones">
            {leccion ? (
              <a className="boton boton-chico" href={href(rutas.leccion(leccion))}>
                Ir a la lección
              </a>
            ) : (
              <a className="boton boton-chico" href={href(rutas.aprender)}>
                Ver Aprender
              </a>
            )}
            <a className="boton-texto" href={href(rutas.inicio)}>
              Escribir otro problema
            </a>
          </div>
        </section>
      )}
    </main>
  )
}
