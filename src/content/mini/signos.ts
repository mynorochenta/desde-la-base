import type { MiniLeccion } from './tipos'

export const signos: MiniLeccion = {
  concepto: 'signos',
  regla:
    'Al multiplicar o dividir: signos iguales dan más y signos distintos dan menos. Al sumar: con signos iguales, se suman los números y se deja el signo; con signos distintos, se restan y se deja el signo del que está más lejos del 0.',
  ejemplos: [
    { problema: '-3 · (-4)', explicacion: 'Los dos son negativos, signos iguales: da más. 3 · 4 = 12, así que el resultado es 12.' },
    { problema: '-7 + 3', explicacion: 'Signos distintos: 7 − 3 = 4, y se deja el signo del 7, que está más lejos del 0. Da −4.' },
    { problema: '5 - (-2)', explicacion: 'Restar un negativo es sumar: quitarte una deuda de 2 es como ganar 2. Queda 5 + 2 = 7.' },
  ],
  cuidado: '"Menos por menos da más" es para multiplicar y dividir. En −3 − 4 no hay multiplicación: es deber 3 y deber 4 más, así que da −7.',
}
