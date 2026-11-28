import type { MiniLeccion } from './tipos'

export const jerarquia: MiniLeccion = {
  concepto: 'jerarquia',
  regla:
    'En una operación larga se sigue este orden: primero lo que está dentro de paréntesis, después las potencias, después las multiplicaciones y divisiones, y al final las sumas y restas. Si hay dos del mismo nivel, se va de izquierda a derecha.',
  ejemplos: [
    { problema: '2 + 3 · 4', explicacion: 'Primero la multiplicación: 3 · 4 = 12. Después la suma: 2 + 12 = 14.' },
    { problema: '12 ÷ 3 · 2', explicacion: 'Dividir y multiplicar están en el mismo nivel, así que se va de izquierda a derecha: 12 ÷ 3 = 4 y después 4 · 2 = 8.' },
    { problema: '(2 + 3) · 4', explicacion: 'El paréntesis va primero: 2 + 3 = 5. Después 5 · 4 = 20.' },
  ],
  cuidado: 'Si vas de izquierda a derecha sin fijarte en el orden, 2 + 3 · 4 te da 20, y no es cierto: el resultado es 14.',
}
