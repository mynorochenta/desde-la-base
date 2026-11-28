import { useMemo, useState } from 'react'
import { conceptos } from '../content/concepts'
import { minis } from '../content/mini'
import { semillaNueva } from '../engine/rng'
import { variables, type Nodo } from '../expr/ast'
import { leerProblema, type Lectura } from '../expr/parse'
import { textoDe } from '../expr/tokens'
import { porQueNo, temaCercano } from '../motores/cercano'
import { despachar } from '../motores/registro'
import type { Motor } from '../motores/tipos'
import { CajaResultado } from '../resolver/CajaResultado'
import { HojaTema } from '../resolver/HojaTema'
import { leerTemas } from '../resolver/temas'
import { RevisarRespuesta } from '../resolver/RevisarRespuesta'
import { ListaPasos, VisorPasos } from '../resolver/VisorPasos'
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


/** "Practicar uno igual": la misma forma con otros números, y revisar la respuesta. */
function PracticarIgual({ motor, problema }: { motor: Motor<unknown>; problema: unknown }) {
  const [semilla, setSemilla] = useState<number | null>(null)
  const nuevo = useMemo(() => (semilla === null ? null : motor.parecido(problema, semilla)), [motor, problema, semilla])

  if (semilla === null) {
    return (
      <button type="button" className="boton" onClick={() => setSemilla(semillaNueva())}>
        Practicar uno igual
      </button>
    )
  }
  if (!nuevo) {
    return (
      <div className="solucion-bloque">
        <p>No encontré uno parecido con números sencillos.</p>
        <button type="button" className="boton-texto" onClick={() => setSemilla(semillaNueva())}>
          Intentar otra vez
        </button>
      </div>
    )
  }
  const expr = motor.expresion(nuevo)
  return (
    <div className="solucion-practica">
      <p>Misma forma, otros números. Resuélvelo en tu cuaderno y escribe lo que te dio:</p>
      <div className="solucion-problema">
        <ExpresionAnimada frame={{ expr }} grande />
      </div>
      <RevisarRespuesta
        key={semilla}
        {...formaDeRespuesta(expr)}
        revisar={(r) => motor.revisar(nuevo, r)}
        despues={() => (
          <>
            <button type="button" className="boton boton-chico" onClick={() => setSemilla(semillaNueva())}>
              Otro
            </button>
            <a className="boton-texto" href={href(rutas.resolver(textoDe(expr)))}>
              Ver cómo se resuelve
            </a>
          </>
        )}
      />
    </div>
  )
}

/** Cómo se contesta: en una ecuación se escribe el valor de la letra, y hay botones para los casos sin número. */
function formaDeRespuesta(expr: Nodo): { prefijo: string; atajos: { texto: string; valor: string }[] } {
  if (expr.tipo !== 'igual') return { prefijo: '=', atajos: [{ texto: 'No está definido', valor: 'no está definido' }] }
  const letra = variables(expr)[0] ?? 'x'
  return {
    prefijo: `${letra} =`,
    atajos: [
      { texto: 'No tiene solución', valor: 'no tiene solución' },
      { texto: 'Infinitas soluciones', valor: 'infinitas soluciones' },
    ],
  }
}

type Modo = 'elegir' | 'pasos' | 'revisar'

function Resuelto({ despacho, problema }: { despacho: Extract<ReturnType<typeof despachar>, { estado: 'resuelto' }>; problema: string }) {
  const { solucion, motor } = despacho
  const [modo, setModo] = useState<Modo>('elegir')
  const [indice, setIndice] = useState(0)
  const pasos = solucion.pasos
  const verPasos = (i = 0) => {
    setIndice(i)
    setModo('pasos')
  }

  return (
    <>
      {modo === 'elegir' && (
        <section className="solucion-bloque" aria-labelledby="elegir-t">
          <h2 id="elegir-t" className="solucion-subtitulo">
            Ya lo resolví. ¿Qué quieres hacer?
          </h2>
          <div className="solucion-elegir">
            <button type="button" className="boton" onClick={() => verPasos(0)}>
              Ver la solución paso a paso
            </button>
            <button type="button" className="boton boton-secundario" onClick={() => setModo('revisar')}>
              Ya lo hice: revisar mi respuesta
            </button>
          </div>
        </section>
      )}

      {modo === 'revisar' && (
        <section className="solucion-bloque" aria-labelledby="revisar-t">
          <h2 id="revisar-t" className="solucion-subtitulo">
            Revisar mi respuesta
          </h2>
          <p>Escribe lo que te dio. Si te equivocaste, busco el error más común que lleva a tu respuesta.</p>
          <RevisarRespuesta
            {...formaDeRespuesta(motor.expresion(despacho.problema))}
            revisar={(r) => motor.revisar(despacho.problema, r)}
            alVerPaso={(i) => verPasos(i)}
            despues={() => (
              <button type="button" className="boton-texto" onClick={() => verPasos(0)}>
                Ver la solución paso a paso
              </button>
            )}
          />
        </section>
      )}

      {modo === 'pasos' && (
        <section className="solucion-bloque solucion-pasos" aria-labelledby="pasos-t">
          <h2 id="pasos-t" className="solucion-subtitulo">
            Paso a paso
          </h2>
          {pasos.length > 0 ? (
            <>
              <VisorPasos pasos={pasos} problema={problema} indice={indice} alCambiar={setIndice} />
              <ListaPasos pasos={pasos} alElegir={setIndice} />
            </>
          ) : (
            <p>Ya está en su forma más simple: no hay nada que calcular.</p>
          )}
        </section>
      )}

      {modo === 'pasos' && (indice === pasos.length - 1 || pasos.length === 0) && <CajaResultado resultado={solucion.resultado} expr={motor.expresion(despacho.problema)} />}

      {modo !== 'elegir' && solucion.resultado.tipo !== 'no-definido' && (
        <section className="solucion-bloque" aria-labelledby="practicar-t">
          <h2 id="practicar-t" className="solucion-subtitulo">
            ¿Lo quieres practicar?
          </h2>
          <PracticarIgual motor={motor} problema={despacho.problema} />
        </section>
      )}
    </>
  )
}

export function Solucion() {
  const params = useUbicacion().params
  const problema = params.get('p') ?? ''
  const temas = leerTemas(params.get('tema'))
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
  const razon = despacho?.estado === 'no-reconocido' ? porQueNo(lectura.ast) : null

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
        <Resuelto key={problema} despacho={despacho} problema={problema} />
      ) : (
        <section className="solucion-bloque" aria-labelledby="no-t">
          <h2 id="no-t" className="solucion-subtitulo">
            {despacho?.estado === 'no-verificado' ? 'No pude comprobar el resultado' : 'Todavía no sé resolver este tipo de problema'}
          </h2>
          {razon && <p className="solucion-razon">{razon}</p>}
          <p>
            {despacho?.estado === 'no-verificado'
              ? 'Lo reconocí, pero mi resultado no pasó la comprobación, así que no te lo muestro.'
              : 'Prefiero decírtelo antes que darte un resultado que no puedo explicar.'}{' '}
            El tema más cercano es <strong>{conceptos[tema].nombre}</strong>.
          </p>
          <div className="solucion-acciones">
            {minis[tema] && (
              <a className="boton boton-chico boton-secundario" href={href(rutas.resolver(problema, [tema]))}>
                Repasar {conceptos[tema].nombre}
              </a>
            )}
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
      {temas.length > 0 && <HojaTema problema={problema} temas={temas} />}
    </main>
  )
}
