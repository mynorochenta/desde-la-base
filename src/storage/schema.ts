/**
 * Forma del progreso guardado. Las claves de concepto son texto (no el tipo
 * ConceptoId) para que un progreso viejo no se rompa si después se agregan
 * o quitan conceptos.
 *
 * Si cambias esta forma: sube VERSION y agrega el paso en `migrar`.
 */
export const VERSION = 1

export type Veredicto = 'dominado' | 'no-dominado' | 'sin-probar'

export type Registro = {
  concepto: string
  tipo: string
  semilla: number
  correcto: boolean
}

export type Progreso = {
  version: typeof VERSION
  diagnostico: {
    fecha: number
    veredictos: Record<string, Veredicto>
    historial: Registro[]
  } | null
  conceptos: Record<string, { dominado: boolean; fuente: 'diagnostico' | 'leccion'; fecha: number }>
  lecciones: Record<string, { paso: number; completada: boolean; fecha: number }>
}

export function progresoNuevo(): Progreso {
  return { version: VERSION, diagnostico: null, conceptos: {}, lecciones: {} }
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const esNumero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const VEREDICTOS: readonly string[] = ['dominado', 'no-dominado', 'sin-probar']

/** Lleva datos de versiones viejas a la actual. Hoy solo existe la versión 1. */
function migrar(datos: Record<string, unknown>): Record<string, unknown> | null {
  if (datos.version === VERSION) return datos
  return null
}

/**
 * Revisa que unos datos desconocidos (de localStorage o de un código
 * importado) tengan la forma correcta. Lo que esté mal se descarta en
 * vez de romper la app.
 */
export function validar(entrada: unknown): Progreso | null {
  if (!esObjeto(entrada)) return null
  const d = migrar(entrada)
  if (!d) return null

  const p = progresoNuevo()

  if (esObjeto(d.diagnostico) && esNumero(d.diagnostico.fecha) && esObjeto(d.diagnostico.veredictos)) {
    const veredictos: Record<string, Veredicto> = {}
    for (const [k, v] of Object.entries(d.diagnostico.veredictos)) {
      if (typeof v === 'string' && VEREDICTOS.includes(v)) veredictos[k] = v as Veredicto
    }
    const historial = Array.isArray(d.diagnostico.historial)
      ? d.diagnostico.historial.filter(
          (r): r is Registro =>
            esObjeto(r) &&
            typeof r.concepto === 'string' &&
            typeof r.tipo === 'string' &&
            esNumero(r.semilla) &&
            typeof r.correcto === 'boolean',
        )
      : []
    p.diagnostico = { fecha: d.diagnostico.fecha, veredictos, historial }
  }

  if (esObjeto(d.conceptos)) {
    for (const [k, v] of Object.entries(d.conceptos)) {
      if (esObjeto(v) && typeof v.dominado === 'boolean' && (v.fuente === 'diagnostico' || v.fuente === 'leccion') && esNumero(v.fecha)) {
        p.conceptos[k] = { dominado: v.dominado, fuente: v.fuente, fecha: v.fecha }
      }
    }
  }

  if (esObjeto(d.lecciones)) {
    for (const [k, v] of Object.entries(d.lecciones)) {
      if (esObjeto(v) && esNumero(v.paso) && typeof v.completada === 'boolean' && esNumero(v.fecha)) {
        p.lecciones[k] = { paso: v.paso, completada: v.completada, fecha: v.fecha }
      }
    }
  }

  return p
}

export function serializar(p: Progreso): string {
  return JSON.stringify(p)
}

export function deserializar(texto: string): Progreso | null {
  try {
    return validar(JSON.parse(texto))
  } catch {
    return null
  }
}

// --- Para la fase 2: exportar e importar el progreso con un código, sin cuentas ---

function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(codigo: string): string {
  const b64 = codigo.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** Convierte el progreso en un código que se puede copiar y pegar. */
export function codificar(p: Progreso): string {
  return aBase64Url(serializar(p))
}

/** Lee un código de progreso. Devuelve null si el código no sirve. */
export function decodificar(codigo: string): Progreso | null {
  try {
    return deserializar(deBase64Url(codigo.trim()))
  } catch {
    return null
  }
}
