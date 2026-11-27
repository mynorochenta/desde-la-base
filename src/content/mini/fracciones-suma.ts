import type { MiniLeccion } from './tipos'

export const fraccionesSuma: MiniLeccion = {
  concepto: 'fracciones-suma',
  regla:
    'Solo se suman directo las fracciones que tienen el mismo denominador (el número de abajo), porque así las partes son del mismo tamaño. Si son distintos, primero se cambian a un denominador común. Después se suman los de arriba y el de abajo se queda igual.',
  ejemplos: [
    { problema: '1/5 + 2/5', explicacion: 'Tienen el mismo denominador: 1 + 2 = 3 arriba y el 5 se queda. Da 3/5.' },
    { problema: '1/2 + 1/3', explicacion: 'Un denominador común es 6: 1/2 = 3/6 y 1/3 = 2/6. Entonces 3/6 + 2/6 = 5/6.' },
  ],
  cuidado: 'No se suma arriba con arriba y abajo con abajo: 1/2 + 1/3 no es 2/5. Con medio y un tercio tienes más de la mitad, y 2/5 es menos que la mitad.',
}
