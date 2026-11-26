import { Suspense, lazy } from 'react'
import { MotionConfig } from 'motion/react'
import { useRuta } from './router'
import { Inicio } from './screens/Inicio'
import { Pendiente } from './screens/Pendiente'

// Se cargan solo cuando se abren, para que la portada pese poco.
const Diagnostico = lazy(() => import('./screens/Diagnostico').then((m) => ({ default: m.Diagnostico })))
const Resultado = lazy(() => import('./screens/Resultado').then((m) => ({ default: m.Resultado })))

function Pantalla({ ruta }: { ruta: string }) {
  if (ruta === '/diagnostico') return <Diagnostico />
  if (ruta === '/resultado') return <Resultado />
  if (ruta.startsWith('/leccion/')) return <Pendiente titulo="Lección" />
  return <Inicio />
}

export default function App() {
  const ruta = useRuta()
  return (
    // reducedMotion="user": Motion respeta "reducir movimiento" del teléfono.
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<main className="hoja" aria-busy="true" />}>
        <Pantalla key={ruta} ruta={ruta} />
      </Suspense>
    </MotionConfig>
  )
}
