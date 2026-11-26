/** Aplica una tecla al texto actual. */
export function aplicarTecla(actual: string, tecla: string): string {
  if (tecla === 'borrar') return actual.slice(0, -1)
  if (actual.length >= 14) return actual
  return actual + tecla
}
