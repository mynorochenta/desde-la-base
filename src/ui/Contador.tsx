import { useId } from 'react'

const menos = (n: number) => (n < 0 ? `−${-n}` : `${n}`)

/** Un número que se sube o se baja con dos botones. Se salta el cero si `sinCero`. */
export function Contador({
  etiqueta,
  valor,
  min,
  max,
  sinCero = true,
  alCambiar,
}: {
  etiqueta: string
  valor: number
  min: number
  max: number
  sinCero?: boolean
  alCambiar: (n: number) => void
}) {
  const id = useId()
  const mover = (d: 1 | -1) => {
    let n = valor + d
    if (sinCero && n === 0) n += d
    if (n >= min && n <= max) alCambiar(n)
  }
  const bajar = valor - 1 === 0 && sinCero ? valor - 2 : valor - 1
  const subir = valor + 1 === 0 && sinCero ? valor + 2 : valor + 1
  return (
    <div className="contador" role="group" aria-labelledby={id}>
      <span id={id} className="contador-etiqueta">
        {etiqueta}
      </span>
      <div className="contador-fila">
        <button type="button" className="contador-boton" aria-label={`Bajar a ${menos(bajar)}`} disabled={bajar < min} onClick={() => mover(-1)}>
          −
        </button>
        <output className="contador-valor" aria-live="polite">
          {menos(valor)}
        </output>
        <button type="button" className="contador-boton" aria-label={`Subir a ${menos(subir)}`} disabled={subir > max} onClick={() => mover(1)}>
          +
        </button>
      </div>
    </div>
  )
}
