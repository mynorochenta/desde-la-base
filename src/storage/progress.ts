import { useSyncExternalStore } from 'react'
import { deserializar, progresoNuevo, serializar, type Progreso } from './schema'

const CLAVE = 'desde-la-base:progreso'

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function almacenPorDefecto(): Almacen | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Algunos navegadores bloquean localStorage (modo privado, cookies apagadas).
    return null
  }
}

/** Lee el progreso. Si no hay o está dañado, empieza uno nuevo. Nunca lanza error. */
export function cargar(almacen = almacenPorDefecto()): Progreso {
  try {
    const texto = almacen?.getItem(CLAVE)
    if (!texto) return progresoNuevo()
    return deserializar(texto) ?? progresoNuevo()
  } catch {
    return progresoNuevo()
  }
}

/** Guarda el progreso. Devuelve false si no se pudo (por ejemplo, almacenamiento lleno). */
export function guardar(p: Progreso, almacen = almacenPorDefecto()): boolean {
  try {
    if (!almacen) return false
    almacen.setItem(CLAVE, serializar(p))
    return true
  } catch {
    return false
  }
}

// --- Estado compartido para React ---

let actual: Progreso | null = null
const oyentes = new Set<() => void>()

function leer(): Progreso {
  if (!actual) actual = cargar()
  return actual
}

/** Cambia el progreso, lo guarda y avisa a las pantallas. */
export function actualizarProgreso(cambio: (p: Progreso) => Progreso): boolean {
  actual = cambio(leer())
  const ok = guardar(actual)
  oyentes.forEach((o) => o())
  return ok
}

export function useProgreso(): Progreso {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => oyentes.delete(o)
    },
    leer,
    leer,
  )
}
