import { useSyncExternalStore } from 'react'

/**
 * Router mínimo por hash (#/diagnostico). Funciona en GitHub Pages y Vercel
 * sin configurar redirecciones, y no agrega peso al sitio.
 */
export const rutas = {
  inicio: '/',
  diagnostico: '/diagnostico',
  resultado: '/resultado',
  leccion: (id: string) => `/leccion/${id}`,
} as const

function leer(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h === '' ? '/' : h
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRuta(): string {
  return useSyncExternalStore(subscribe, leer, () => '/')
}

export function ir(ruta: string) {
  window.location.hash = ruta
  window.scrollTo(0, 0)
}

export function href(ruta: string) {
  return `#${ruta}`
}
