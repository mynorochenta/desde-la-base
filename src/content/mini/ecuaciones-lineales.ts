import type { MiniLeccion } from './tipos'

export const ecuacionesLineales: MiniLeccion = {
  concepto: 'ecuaciones-lineales',
  regla:
    'Una ecuación es como una balanza en equilibrio: lo de la izquierda pesa lo mismo que lo de la derecha. Para encontrar la x, la vas dejando sola, y todo lo que haces en un lado lo haces también en el otro. Así la balanza sigue en equilibrio.',
  ejemplos: [
    { problema: 'x + 5 = 12', explicacion: 'Para quitar el 5, resta 5 en los dos lados: x + 5 − 5 = 12 − 5. Queda x = 7.' },
    { problema: '3x = 12', explicacion: 'La x está multiplicada por 3: divide los dos lados entre 3. Queda x = 4.' },
    {
      problema: '2x - 1 = 8x + 11',
      explicacion: 'Resta 8x en los dos lados (queda −6x − 1 = 11), suma 1 en los dos lados (−6x = 12) y divide los dos lados entre −6: x = −2.',
    },
  ],
  cuidado:
    'El atajo "pasa al otro lado con el signo contrario" funciona porque en realidad haces lo mismo en los dos lados. Lo que multiplica pasa dividiendo, sin cambiar de signo. Y siempre puedes comprobar: pon tu resultado en lugar de la x y mira si los dos lados dan lo mismo.',
}
