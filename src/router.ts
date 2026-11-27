import { useSyncExternalStore } from 'react'

/**
 * Router mínimo por hash (#/resolver?p=…). Funciona en GitHub Pages y Vercel
 * sin configurar redirecciones, y no agrega peso al sitio.
 *
 * Lo que viene después del ? lo escribe cualquiera (se puede compartir un
 * enlace), así que es texto no confiable: se lee con URLSearchParams y
 * nunca se inserta como HTML.
 */
export const rutas = {
  inicio: '/',
  resolver: (problema: string, temas: string[] = []) => {
    const q = new URLSearchParams({ p: problema })
    if (temas.length) q.set('tema', temas.join(','))
    return `/resolver?${q.toString()}`
  },
  /** Volver a escribir el problema, con el anterior ya puesto. */
  escribir: (problema: string) => `/?${new URLSearchParams({ p: problema }).toString()}`,
  aprender: '/aprender',
  diagnostico: '/diagnostico',
  resultado: '/resultado',
  leccion: (id: string) => `/leccion/${id}`,
} as const

export type Ubicacion = { camino: string; params: URLSearchParams }

/** Separa "#/resolver?p=2%2B3" en camino y parámetros. Nunca lanza. */
export function leerUbicacion(hash: string): Ubicacion {
  const h = hash.replace(/^#/, '')
  const i = h.indexOf('?')
  const camino = (i === -1 ? h : h.slice(0, i)) || '/'
  let params: URLSearchParams
  try {
    params = new URLSearchParams(i === -1 ? '' : h.slice(i + 1))
  } catch {
    params = new URLSearchParams()
  }
  return { camino, params }
}

function leer(): string {
  return window.location.hash
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** El hash completo; cambia cuando cambia la ruta. */
function useHash(): string {
  return useSyncExternalStore(subscribe, leer, () => '')
}

export function useUbicacion(): Ubicacion {
  return leerUbicacion(useHash())
}

/** Solo el camino, sin parámetros: "/resolver". */
export function useRuta(): string {
  return useUbicacion().camino
}

/** Navega a la ruta. Con `arriba: false` no sube la página (por ejemplo, al abrir una hoja). */
export function ir(ruta: string, { arriba = true }: { arriba?: boolean } = {}) {
  window.location.hash = ruta
  if (arriba) window.scrollTo(0, 0)
}

export function href(ruta: string) {
  return `#${ruta}`
}

/** ¿A qué sección pertenece un camino? Para marcar la pestaña. */
export function seccionDe(camino: string): 'resolver' | 'aprender' {
  return camino === '/' || camino.startsWith('/resolver') ? 'resolver' : 'aprender'
}
