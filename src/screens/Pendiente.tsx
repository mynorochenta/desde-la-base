import { href, rutas } from '../router'

/** Pantalla temporal para las partes que se construyen en etapas siguientes. */
export function Pendiente({ titulo }: { titulo: string }) {
  return (
    <main className="hoja">
      <h1 style={{ fontSize: 'var(--t3)', marginBottom: 'var(--cuadro)' }}>{titulo}</h1>
      <p style={{ marginBottom: 'calc(var(--cuadro) * 2)' }}>Esta parte todavía se está construyendo.</p>
      <a className="boton-texto" href={href(rutas.inicio)}>
        Volver al inicio
      </a>
    </main>
  )
}
