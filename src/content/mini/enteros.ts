import type { MiniLeccion } from './tipos'

export const enteros: MiniLeccion = {
  concepto: 'enteros',
  regla:
    'Los enteros son los números sin parte decimal: …, −3, −2, −1, 0, 1, 2, 3, … En la recta numérica, los positivos van a la derecha del 0 y los negativos a la izquierda. Sumar es avanzar hacia la derecha y restar es ir hacia la izquierda.',
  ejemplos: [
    { problema: '3 - 5', explicacion: 'Desde el 3 vas 5 lugares a la izquierda: pasas el 0 y llegas a −2.' },
    { problema: '-4 + 6', explicacion: 'Desde el −4 avanzas 6 lugares a la derecha: llegas a 2.' },
  ],
  cuidado: 'Un negativo es como una deuda: −5 es deber 5. Por eso −2 es mayor que −7: debes menos.',
}
