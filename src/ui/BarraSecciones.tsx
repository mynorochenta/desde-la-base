import { href, rutas, seccionDe, useRuta } from '../router'
import './BarraSecciones.css'

/** Lápiz dibujado a mano. */
function Lapiz() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 25 L9 18 L22 5 Q24 3.5 26 5.5 Q28 7.5 26.5 9.5 L13.5 22.5 Z" />
      <path d="M9 18 L13.5 22.5" />
      <path d="M19.5 7.5 L24.5 12.5" />
    </svg>
  )
}

/** Mapa de conceptos: tres puntos unidos. */
function Mapa() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 24 L16 9 L24 22" />
      <circle cx="8" cy="24" r="3.2" />
      <circle cx="16" cy="9" r="3.2" />
      <circle cx="24" cy="22" r="3.2" />
    </svg>
  )
}

/** Navegación entre las dos secciones: abajo en el teléfono, arriba en pantallas grandes. */
export function BarraSecciones() {
  const seccion = seccionDe(useRuta())
  return (
    <nav className="barra" aria-label="Secciones">
      <a className="barra-marca" href={href(rutas.inicio)}>
        Desde la base
      </a>
      <div className="barra-pestanas">
        <a className="barra-pestana" href={href(rutas.inicio)} aria-current={seccion === 'resolver' ? 'page' : undefined}>
          <Lapiz />
          <span>Resolver</span>
        </a>
        <a className="barra-pestana" href={href(rutas.aprender)} aria-current={seccion === 'aprender' ? 'page' : undefined}>
          <Mapa />
          <span>Aprender</span>
        </a>
      </div>
    </nav>
  )
}
