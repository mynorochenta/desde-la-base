/**
 * Configuración que podés cambiar sin tocar el resto del código.
 *
 * Formularios externos (Tally o Google Forms):
 * - En Google Forms: "Obtener vínculo previamente completado" te da los
 *   nombres de campo `entry.123456`. Ponelos en `fields`.
 * - En Tally: usá "hidden fields" y poné sus nombres en `fields`.
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
