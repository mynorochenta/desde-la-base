/**
 * Carga y configura MathLive. Este módulo solo se importa con import()
 * desde CampoProblema, así que MathLive no pesa en el resto del sitio.
 */
import { MathfieldElement } from 'mathlive'
// Las fuentes de KaTeX son las mismas que usa MathLive: se cargan una sola vez.
import 'katex/dist/katex.min.css'

// Sin sonidos, y sin bajar fuentes propias (ya vienen con KaTeX).
MathfieldElement.soundsDirectory = null
MathfieldElement.keypressSound = null
MathfieldElement.plonkSound = null
MathfieldElement.fontsDirectory = null

/** \mixto{1}{1}{2} = 1½. Solo se escribe con su tecla: así no choca con 1·½. */
export const macros = {
  mixto: { args: 3, def: '#1\\frac{#2}{#3}', captureSelection: false, expand: false },
}

/** Teclado virtual: solo lo que los motores entienden. */
window.mathVirtualKeyboard.layouts = [
  {
    label: '123',
    tooltip: 'Números y operaciones',
    displayEditToolbar: false,
    rows: [
      ['7', '8', '9', { latex: '\\div', tooltip: 'Dividir' }, { latex: '\\frac{#@}{#?}', tooltip: 'Fracción' }, { label: '⌫', command: 'deleteBackward', class: 'action', tooltip: 'Borrar' }],
      ['4', '5', '6', { latex: '\\times', tooltip: 'Multiplicar' }, { latex: '#@^{#?}', tooltip: 'Potencia' }, { label: '1½', insert: '\\mixto{#?}{#?}{#?}', tooltip: 'Número mixto', class: 'small' }],
      ['1', '2', '3', { latex: '-', tooltip: 'Menos' }, { latex: '(', key: '(' }, { latex: ')', key: ')' }],
      ['0', { latex: 'x', tooltip: 'Letra x' }, { latex: '+', tooltip: 'Más' }, { latex: '=', tooltip: 'Igual' }, { label: '←', command: 'moveToPreviousChar', class: 'action', tooltip: 'Izquierda' }, { label: '→', command: 'moveToNextChar', class: 'action', tooltip: 'Derecha' }],
    ],
  },
]

/**
 * Mientras el teclado virtual está abierto, la barra de secciones se esconde
 * (si no, queda encima de las teclas) y la página deja espacio para el teclado.
 */
window.mathVirtualKeyboard.addEventListener('geometrychange', () => {
  const kb = window.mathVirtualKeyboard
  const alto = kb.visible ? Math.round(kb.boundingRect.height) : 0
  document.documentElement.toggleAttribute('data-teclado-abierto', alto > 0)
  document.documentElement.style.setProperty('--alto-teclado', `${alto}px`)
})

export { MathfieldElement }
