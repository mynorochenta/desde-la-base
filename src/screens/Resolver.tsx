import { leerProblema } from '../expr/parse'
import { textoDe } from '../expr/tokens'
import { ir, rutas, useUbicacion } from '../router'
import { CampoProblema } from '../resolver/CampoProblema'
import './Resolver.css'

/** Ejemplos para tocar. Se escriben como el parser los lee. */
const EJEMPLOS = ['3/4 + 5/6', '2 + 3 · 4', '-3^2 + (-2)^3', '2x - 1 = 8x + 11', '3(x + 2) = 2x - 5']

/** Pantalla principal: escribir el problema. */
export function Resolver() {
  // ?p= es texto no confiable: solo se usa como valor del campo o pasa por el parser.
  const inicial = useUbicacion().params.get('p') ?? ''

  const enviar = (problema: string) => {
    if (problema.trim() === '') return
    ir(rutas.resolver(problema))
  }

  return (
    <main className="hoja hoja-ancha resolver">
      <div className="resolver-escribir">
        <h1 className="resolver-titulo">¿Qué problema tienes hoy?</h1>
        <p className="resolver-texto">Escríbelo como está en tu tarea y te lo explico paso a paso.</p>
        <label className="sr-only" htmlFor="problema">
          Tu problema
        </label>
        <CampoProblema id="problema" inicial={inicial} alEnviar={enviar} />
      </div>

      <aside className="resolver-ejemplos" aria-labelledby="ejemplos-t">
        <h2 id="ejemplos-t" className="resolver-subtitulo">
          O toca un ejemplo
        </h2>
        <ul className="resolver-lista">
          {EJEMPLOS.map((e) => {
            const l = leerProblema(e)
            return (
              <li key={e}>
                <button type="button" className="resolver-ejemplo" onClick={() => enviar(e)}>
                  {/* Texto plano: así la portada no carga KaTeX. */}
                  {l.ok ? textoDe(l.ast) : e}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="resolver-nota">
          Resuelvo operaciones con enteros, signos, fracciones, potencias y el orden de las operaciones, y ecuaciones
          lineales con una letra. Todo pasa en tu dispositivo, sin enviar nada.
        </p>
      </aside>
    </main>
  )
}
