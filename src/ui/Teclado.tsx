import './Teclado.css'

type Tecla = { valor: string; texto: string; etiqueta?: string; ancho?: 2 }

const TECLAS: Tecla[] = [
  { valor: '1', texto: '1' },
  { valor: '2', texto: '2' },
  { valor: '3', texto: '3' },
  { valor: 'borrar', texto: '⌫', etiqueta: 'Borrar' },
  { valor: '4', texto: '4' },
  { valor: '5', texto: '5' },
  { valor: '6', texto: '6' },
  { valor: '-', texto: '−', etiqueta: 'Menos' },
  { valor: '7', texto: '7' },
  { valor: '8', texto: '8' },
  { valor: '9', texto: '9' },
  { valor: '/', texto: '/', etiqueta: 'Fracción' },
  { valor: ',', texto: ',', etiqueta: 'Coma decimal' },
  { valor: '0', texto: '0', ancho: 2 },
  { valor: ' ', texto: '␣', etiqueta: 'Espacio, para números mixtos como 1 1/2' },
]

/**
 * Teclado propio para el teléfono: el teclado numérico del sistema a veces
 * no trae el signo menos ni la barra de fracción.
 */
export function Teclado({ alTocar, desactivado = false }: { alTocar: (tecla: string) => void; desactivado?: boolean }) {
  return (
    <div className="teclado" role="group" aria-label="Teclado para escribir la respuesta">
      {TECLAS.map((t) => (
        <button
          key={t.valor}
          type="button"
          className={`tecla${t.ancho === 2 ? ' tecla-doble' : ''}${t.valor === 'borrar' ? ' tecla-borrar' : ''}`}
          aria-label={t.etiqueta ?? t.texto}
          disabled={desactivado}
          onClick={() => alTocar(t.valor)}
        >
          {t.texto}
        </button>
      ))}
    </div>
  )
}
