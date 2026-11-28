import type { MiniLeccion } from './tipos'

export const potencias: MiniLeccion = {
  concepto: 'potencias',
  regla:
    'El exponente, el número pequeño de arriba, dice cuántas veces se multiplica la base por sí misma: 2³ = 2 · 2 · 2 = 8. Cualquier número que no sea 0, elevado a la 0, da 1.',
  ejemplos: [
    { problema: '(-2)^4', explicacion: '(−2) · (−2) · (−2) · (−2) = 16. Con exponente par, los signos menos se cancelan de dos en dos y da positivo.' },
    { problema: '-3^2', explicacion: 'Sin paréntesis, el exponente solo afecta al 3: es −(3 · 3) = −9. En cambio, (−3)² = 9.' },
    { problema: '2^-3', explicacion: 'Un exponente negativo da una fracción: 2⁻³ = 1/2³ = 1/8.' },
  ],
  cuidado: '2³ no es 2 · 3 = 6. Es 2 · 2 · 2 = 8.',
}
