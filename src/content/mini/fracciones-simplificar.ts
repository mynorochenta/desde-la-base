import type { MiniLeccion } from './tipos'

export const fraccionesSimplificar: MiniLeccion = {
  concepto: 'fracciones-simplificar',
  regla:
    'Simplificar es dividir el número de arriba y el de abajo entre el mismo número. La fracción vale lo mismo, pero con números más pequeños. Ya está simplificada cuando ningún número mayor que 1 divide exacto a los dos.',
  ejemplos: [
    { problema: '6/8', explicacion: 'El 6 y el 8 se pueden dividir entre 2: 6 ÷ 2 = 3 y 8 ÷ 2 = 4. Queda 3/4.' },
    { problema: '12/18', explicacion: 'El número más grande que divide exacto a 12 y a 18 es 6: 12 ÷ 6 = 2 y 18 ÷ 6 = 3. Queda 2/3.' },
  ],
  cuidado: 'Hay que dividir los dos entre el mismo número. Si solo divides uno, la fracción cambia de valor.',
}
