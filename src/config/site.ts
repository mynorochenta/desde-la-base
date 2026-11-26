/**
 * Configuración que puedes cambiar sin tocar el resto del código.
 *
 * Formularios externos (Tally o Google Forms):
 * - En Google Forms: "Obtener vínculo previamente completado" te da los
 *   nombres de campo `entry.123456`. Ponlos en `fields`.
 * - En Tally: usa "hidden fields" y pon sus nombres en `fields`.
 */
export const site = {
  nombre: 'Desde la base',

  reportarError: {
    url: 'https://tally.so/r/CAMBIAR',
    fields: {
      concepto: 'concepto',
      ejercicio: 'ejercicio',
      respuesta: 'respuesta',
      semilla: 'semilla',
    },
  },

  sugerencias: {
    url: 'https://tally.so/r/CAMBIAR',
  },
} as const
