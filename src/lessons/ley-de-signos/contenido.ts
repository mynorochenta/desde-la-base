/**
 * Textos y datos de la lección de ley de signos. Están aparte del código para
 * poder corregirlos sin tocar los componentes.
 */
import type { CasoProducto, CasoSuma, Saltos } from './saltos'
import { producto, resta } from './saltos'

export const LECCION_ID = 'ley-de-signos'
export const CONCEPTO = 'signos' as const

export const PASOS = [
  { id: 'recta-suma', titulo: 'Sumar y restar' },
  { id: 'recta-producto', titulo: 'Multiplicar y dividir' },
  { id: 'ejemplo', titulo: 'Ejemplo guiado' },
  { id: 'practica', titulo: 'Práctica' },
  { id: 'prueba', titulo: 'Mini prueba' },
] as const

// --- Paso 1: sumar y restar en la recta ---

export const RANGO_SUMA = { inicio: [-6, 6], numero: [-6, 6], recta: [-13, 13] } as const

export const REGLAS_SUMA: Record<CasoSuma, { corto: string; regla: string }> = {
  'suma-positivo': { corto: 'Sumar un positivo', regla: 'Sumar un positivo: la flecha va a la derecha.' },
  'suma-negativo': { corto: 'Sumar un negativo', regla: 'Sumar un negativo: la flecha va a la izquierda.' },
  'resta-positivo': {
    corto: 'Restar un positivo',
    regla: 'Restar voltea la flecha: ahora va a la izquierda.',
  },
  'resta-negativo': {
    corto: 'Restar un negativo',
    regla: 'La flecha del negativo apunta a la izquierda, y restar la voltea: termina yendo a la derecha.',
  },
}

// --- Paso 2: multiplicar ---

export const RANGO_PRODUCTO = { salto: [-4, 4], veces: [-3, 3], recta: [-13, 13] } as const

export const TABLA_SIGNOS: Array<{ caso: CasoProducto; texto: string; resultado: '+' | '−' }> = [
  { caso: '++', texto: 'positivo por positivo', resultado: '+' },
  { caso: '--', texto: 'negativo por negativo', resultado: '+' },
  { caso: '+-', texto: 'positivo por negativo', resultado: '−' },
  { caso: '-+', texto: 'negativo por positivo', resultado: '−' },
]

// --- Paso 3: ejemplos guiados ---

export type PasoGuiado = {
  latex: string
  explicacion: string
  pregunta?: {
    texto: string
    opciones: Array<{ texto: string; correcta: boolean; retro: string }>
  }
}

export type EjemploGuiado = { titulo: string; pasos: PasoGuiado[]; cierre: string; recta: Saltos }

export const EJEMPLOS: EjemploGuiado[] = [
  {
    titulo: 'Una resta con negativos',
    recta: resta(-7, -3),
    pasos: [
      {
        latex: '-7 - (-3)',
        explicacion: 'Hay dos signos menos juntos: el de la resta y el del 3.',
        pregunta: {
          texto: '¿En qué se convierte − (−3)?',
          opciones: [
            { texto: 'En + 3', correcta: true, retro: 'Eso. Restar un negativo es sumar.' },
            { texto: 'En − 3', correcta: false, retro: 'Fíjate en los dos menos: restar un negativo es lo mismo que sumar.' },
          ],
        },
      },
      {
        latex: '-7 + 3',
        explicacion: 'Ahora los signos son distintos. Las cantidades se restan.',
        pregunta: {
          texto: '¿Cuánto es 7 − 3?',
          opciones: [
            { texto: '4', correcta: true, retro: 'Bien.' },
            { texto: '10', correcta: false, retro: 'Con signos distintos no se suma: se resta la cantidad menor de la mayor.' },
          ],
        },
      },
      {
        latex: '-7 + 3',
        explicacion: 'Falta el signo. Lo decide el número con más cantidad.',
        pregunta: {
          texto: '¿Qué signo lleva el resultado?',
          opciones: [
            { texto: 'Negativo, porque 7 es más que 3 y es negativo', correcta: true, retro: 'Correcto: −4.' },
            { texto: 'Positivo, porque estamos sumando', correcta: false, retro: 'El signo lo pone el número más grande, y ese es el −7.' },
          ],
        },
      },
    ],
    cierre: '-7 - (-3) = -4',
  },
  {
    titulo: 'Una multiplicación',
    recta: producto(-6, -4),
    pasos: [
      {
        latex: '(-6) \\cdot (-4)',
        explicacion: 'Primero multiplica las cantidades, sin pensar en los signos.',
        pregunta: {
          texto: '¿Cuánto es 6 · 4?',
          opciones: [
            { texto: '24', correcta: true, retro: 'Bien.' },
            { texto: '10', correcta: false, retro: 'Eso sería sumar. Aquí multiplicamos: 6 · 4.' },
          ],
        },
      },
      {
        latex: '(-6) \\cdot (-4)',
        explicacion: 'Ahora el signo. Cuenta cuántos negativos hay.',
        pregunta: {
          texto: '¿Qué signo lleva el resultado?',
          opciones: [
            { texto: 'Positivo: negativo por negativo da positivo', correcta: true, retro: 'Correcto: 24.' },
            { texto: 'Negativo, porque los dos son negativos', correcta: false, retro: 'Dos signos iguales dan positivo. En la recta: los saltos de −6, volteados.' },
          ],
        },
      },
    ],
    cierre: '(-6) \\cdot (-4) = 24',
  },
]

// --- Pasos 4 y 5: práctica y mini prueba ---

/** Los cuatro tipos de ejercicio de signos aparecen al menos una vez. */
export const TIPOS = ['sumaDistinto', 'restaNegativo', 'producto', 'division'] as const

export const PRACTICA = { cantidad: 6 }
export const PRUEBA = { cantidad: 6, paraPasar: 5 }
