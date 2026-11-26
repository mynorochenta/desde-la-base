/**
 * Cuenta las preguntas con palitos, como se cuenta en el cuaderno:
 * cuatro rayas y la quinta las cruza.
 */
export function Palitos({ cantidad }: { cantidad: number }) {
  const grupos = Math.ceil(cantidad / 5)
  const ancho = Math.max(1, grupos) * 34
  return (
    <svg className="palitos" width={ancho} height={26} viewBox={`0 0 ${ancho} 26`} aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => {
        const g = Math.floor(i / 5)
        const k = i % 5
        const x0 = g * 34 + 3
        if (k === 4) return <path key={i} d={`M${x0 - 2} 18 L${x0 + 24} 7`} />
        const x = x0 + k * 6
        return <path key={i} d={`M${x} 3 Q ${x + 1.2} 13 ${x - 0.5} 23`} />
      })}
    </svg>
  )
}
