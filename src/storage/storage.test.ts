import { describe, expect, it } from 'vitest'
import { cargar, guardar } from './progress'
import { codificar, decodificar, deserializar, progresoNuevo, serializar, validar, type Progreso } from './schema'

const ejemplo = (): Progreso => ({
  version: 1,
  diagnostico: {
    fecha: 1_700_000_000_000,
    veredictos: { signos: 'no-dominado', enteros: 'dominado', 'fracciones-suma': 'sin-probar' },
    historial: [{ concepto: 'signos', tipo: 'producto', semilla: 12, correcto: false }],
  },
  conceptos: { enteros: { dominado: true, fuente: 'diagnostico', fecha: 1 } },
  lecciones: { 'ley-de-signos': { paso: 2, completada: false, fecha: 2 } },
})

function almacenFalso() {
  const datos = new Map<string, string>()
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    datos,
  }
}

describe('esquema del progreso', () => {
  it('ida y vuelta sin perder nada', () => {
    expect(deserializar(serializar(ejemplo()))).toEqual(ejemplo())
  })

  it('rechaza basura y versiones desconocidas', () => {
    expect(validar(null)).toBeNull()
    expect(validar('hola')).toBeNull()
    expect(validar([])).toBeNull()
    expect(validar({ version: 99 })).toBeNull()
    expect(deserializar('{no es json')).toBeNull()
  })

  it('descarta solo las partes dañadas', () => {
    const dañado = {
      ...ejemplo(),
      conceptos: { enteros: { dominado: 'si' }, signos: { dominado: true, fuente: 'leccion', fecha: 5 } },
      diagnostico: { ...ejemplo().diagnostico!, veredictos: { signos: 'quizas', enteros: 'dominado' } },
    }
    const p = validar(dañado)!
    expect(Object.keys(p.conceptos)).toEqual(['signos'])
    expect(p.diagnostico!.veredictos).toEqual({ enteros: 'dominado' })
  })

  it('código para exportar e importar (fase 2)', () => {
    const codigo = codificar(ejemplo())
    expect(codigo).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodificar(codigo)).toEqual(ejemplo())
    expect(decodificar(`  ${codigo}\n`)).toEqual(ejemplo())
    expect(decodificar('código-inválido')).toBeNull()
  })
})

describe('guardar y cargar', () => {
  it('guarda y vuelve a leer', () => {
    const a = almacenFalso()
    expect(guardar(ejemplo(), a)).toBe(true)
    expect(cargar(a)).toEqual(ejemplo())
  })

  it('sin almacén o con datos dañados empieza de cero', () => {
    expect(cargar(null)).toEqual(progresoNuevo())
    const a = almacenFalso()
    a.datos.set('desde-la-base:progreso', 'basura')
    expect(cargar(a)).toEqual(progresoNuevo())
  })

  it('no revienta si el almacenamiento falla', () => {
    const roto = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('lleno')
      },
      removeItem: () => {},
    }
    expect(cargar(roto)).toEqual(progresoNuevo())
    expect(guardar(ejemplo(), roto)).toBe(false)
  })
})
