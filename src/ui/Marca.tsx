import { motion } from 'motion/react'

/** Palomita azul o tache rojo que se dibuja, como cuando califican el cuaderno. */
export function Marca({ tipo }: { tipo: 'bien' | 'mal' }) {
  const trazo = { initial: { pathLength: 0 }, animate: { pathLength: 1 } }
  return (
    <svg className={`marca marca-${tipo}`} viewBox="0 0 40 40" width={40} height={40} aria-hidden="true">
      {tipo === 'bien' ? (
        <motion.path d="M6 21 L16 31 L35 7" {...trazo} transition={{ duration: 0.35, ease: 'easeOut' }} />
      ) : (
        <>
          <motion.path d="M9 9 L31 31" {...trazo} transition={{ duration: 0.18 }} />
          <motion.path d="M31 9 L9 31" {...trazo} transition={{ duration: 0.18, delay: 0.15 }} />
        </>
      )}
    </svg>
  )
}
