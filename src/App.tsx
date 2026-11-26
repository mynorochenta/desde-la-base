import { useRuta } from './router'
import { Inicio } from './screens/Inicio'
import { Pendiente } from './screens/Pendiente'

export default function App() {
  const ruta = useRuta()

  if (ruta === '/diagnostico') return <Pendiente titulo="Diagnóstico" />
  if (ruta === '/resultado') return <Pendiente titulo="Tu ruta" />
  if (ruta.startsWith('/leccion/')) return <Pendiente titulo="Lección" />
  return <Inicio />
}
