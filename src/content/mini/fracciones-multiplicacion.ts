import type { MiniLeccion } from './tipos'

export const fraccionesMultiplicacion: MiniLeccion = {
  concepto: 'fracciones-multiplicacion',
  regla:
    'Para multiplicar fracciones, multiplica arriba por arriba y abajo por abajo; no hace falta denominador común. Para dividir, multiplica por la segunda fracción volteada, con arriba y abajo cambiados de lugar.',
  ejemplos: [
    { problema: '2/3 · 4/5', explicacion: 'Arriba 2 · 4 = 8 y abajo 3 · 5 = 15. Da 8/15.' },
    { problema: '1/2 ÷ 3/4', explicacion: 'Se voltea la segunda: 1/2 · 4/3 = 4/6, que simplificado es 2/3.' },
  ],
  cuidado: 'Al dividir solo se voltea la segunda fracción, la que está después del ÷. La primera se queda igual.',
}
