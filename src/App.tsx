import { Suspense, lazy } from 'react'
import { MotionConfig } from 'motion/react'
import { useRuta } from './router'
import { Resolver } from './screens/Resolver'
import { Pendiente } from './screens/Pendiente'
import { BarraSecciones } from './ui/BarraSecciones'

// Se cargan solo cuando se abren, para que la portada pese poco.
const Solucion = lazy(() => import('./screens/Solucion').then((m) => ({ default: m.Solucion })))
const Inicio = lazy(() => import('./screens/Inicio').then((m) => ({ default: m.Inicio })))
const Diagnostico = lazy(() => import('./screens/Diagnostico').then((m) => ({ default: m.Diagnostico })))
const Resultado = lazy(() => import('./screens/Resultado').then((m) => ({ default: m.Resultado })))
const LeccionSignos = lazy(() => import('./screens/LeccionSignos').then((m) => ({ default: m.LeccionSignos })))
// Prueba de la animación FLIP: no existe en el sitio publicado.
const DemoFlip = import.meta.env.DEV ? lazy(() => import('./screens/DemoFlip').then((m) => ({ default: m.DemoFlip }))) : null

function Pantalla({ ruta }: { ruta: string }) {
  if (ruta === '/') return <Resolver />
  if (ruta === '/resolver') return <Solucion />
  if (ruta === '/aprender') return <Inicio />
  if (ruta === '/diagnostico') return <Diagnostico />
  if (ruta === '/resultado') return <Resultado />
  if (ruta === '/leccion/ley-de-signos') return <LeccionSignos />
  if (ruta.startsWith('/leccion/')) return <Pendiente titulo="Lección" />
  if (DemoFlip && ruta === '/dev/flip') return <DemoFlip />
  return <Resolver />
}

export default function App() {
  const ruta = useRuta()
  return (
    // reducedMotion="user": Motion respeta "reducir movimiento" del teléfono.
    <MotionConfig reducedMotion="user">
      <div className="app">
        <BarraSecciones />
        <Suspense fallback={<main className="hoja" aria-busy="true" />}>
          <Pantalla key={ruta} ruta={ruta} />
        </Suspense>
      </div>
    </MotionConfig>
  )
}
