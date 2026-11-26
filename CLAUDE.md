# Desde la base: guía del proyecto

Plataforma web **gratuita** para estudiantes de Guatemala y Latinoamérica, que les ayuda a salir adelante en matemática. También es un proyecto de portafolio en GitHub.

Este archivo describe la visión completa. Algunas partes ya existen y otras solo están planeadas; cada sección dice cuál es cuál. **No construyas lo planeado sin que te lo pidan.**

## Reglas que no cambian

- **Sin IA y sin APIs de pago.** Nada de modelos de lenguaje, ni en el navegador ni en un servidor. Todo es determinista:
  - generadores con semilla;
  - revisión exacta de respuestas;
  - reglas escritas a mano para reconocer errores.
- **Gratis y sin cuentas.** El progreso vive en `localStorage` y se podrá llevar a otro dispositivo con un código. No hay backend.
- **Sitio estático.** Se publica en Vercel o GitHub Pages con rutas por hash. Debe funcionar bien en un teléfono de gama baja con datos limitados.
- **Cuentas exactas.** Las cuentas usan fracciones exactas (`src/engine/fraction.ts`), nunca decimales de punto flotante.

## Idioma y tono

- **Textos de la interfaz:** español sencillo y neutral, con **tú** ("revisa", "arrastra", "toca").
  - Nada de voseo ni de modismos de un país.
  - También los comentarios del código van con tú.
- **Commits:**
  - autor **Mynor Arias**;
  - mensaje en español, empezando con un verbo en presente ("Agrega…", "Corrige…", "Separa…").
- **Mensajes al usuario en el chat:** en español.

## Las dos secciones

### Resolver: la sección principal (planeada, no existe todavía)

El estudiante trae **su** problema, por ejemplo uno de la tarea o de una guía de examen, y la app lo resuelve paso a paso, explicando cada paso.

- **Cómo entra el problema:** con el teclado matemático que ya existe (`src/ui/Teclado.tsx`), o eligiendo una plantilla ("ecuación lineal", "suma de fracciones"…).
- **Qué devuelve:** una lista de pasos. Cada paso dice qué cambió y por qué. El porqué se puede abrir con el [árbol del porqué](#árbol-del-porqué).
- **Si no lo reconoce:** si ningún motor puede con el problema, lo dice con claridad y ofrece el tema más cercano en Aprender. **Nunca inventa un resultado.**
- **Lugar en la app:** será la puerta de entrada principal. Hoy la pantalla de inicio lleva al diagnóstico; cuando exista Resolver, el inicio se reorganiza.

### Aprender (existe, fase 1)

Es lo que ya está construido:

1. **Diagnóstico adaptativo.** Son 12 preguntas como máximo. Recorre el mapa de conceptos: si fallas un tema baja a sus prerrequisitos, y si lo dominas sube.
   - Código: `src/diagnostic/machine.ts` y `src/screens/Diagnostico.tsx`.
2. **Mapa y ruta.** Mapa animado con lo dominado, lo que ya puedes aprender y lo bloqueado, más la ruta recomendada.
   - Código: `src/screens/Resultado.tsx` y `src/ui/MapaConceptos.tsx`.
3. **Lecciones.** Por ahora existe una sola, ley de signos (`src/lessons/ley-de-signos/`). Sigue este orden: exploración visual → ejemplo guiado → práctica generada → mini prueba que desbloquea lo siguiente.

Las dos secciones comparten el mapa de conceptos. Un paso de Resolver que usa una regla apunta al concepto de esa regla, y desde ahí a su lección en Aprender.

## Arquitectura de motores por tipo de problema (planeada)

No hay un sistema de álgebra general. Hay **un motor pequeño por tipo de problema**, cada uno con su lógica y sus pruebas. Un motor nuevo no toca a los demás.

Interfaz prevista para cada motor:

```ts
type Motor<P> = {
  tipo: string                                   // 'enteros-signos', 'fracciones-suma', 'ecuacion-lineal'…
  concepto: ConceptoId                           // a qué concepto del mapa pertenece
  reconocer(entrada: Expr): P | null             // ¿este problema es mío? (estructura, no texto)
  resolver(p: P): Paso[]                         // solución paso a paso, determinista
  generar(semilla: number): P                    // para practicar en Aprender
  erroresComunes(p: P): ErrorComun[]             // valores que dan los errores típicos y su explicación
}

type Paso = {
  antes: Expr
  despues: Expr
  regla: ReglaId                                 // raíz del árbol del porqué de este paso
  terminos: Array<{ id: string; de?: string }>   // identidad de cada término, para animar (ver FLIP)
}
```

- **Despacho.** El despachador recorre los motores en orden de prioridad y usa el primero que reconoce el problema.
- **Núcleo compartido.** Se reutiliza lo que ya existe: `engine/fraction.ts`, `engine/parse.ts`, `engine/rng.ts` y `engine/verify.ts`.
- **Relación con lo actual.** Los generadores de `src/content/generators/*.ts` ya cubren `generar` y `erroresComunes`. Cuando se construyan los motores, cada generador pasa a ser parte de su motor. No hay que duplicarlos.
- **Ubicación prevista:** `src/motores/<tipo>/`, con su `motor.ts`, `reglas.ts` y `motor.test.ts`.
- **Pruebas.** Cada motor necesita pruebas de que:
  - el resultado final es correcto con muchas semillas;
  - cada paso conserva el valor de la expresión;
  - no reconoce problemas que no son suyos.

## Árbol del porqué (planeado)

Cada paso de una solución se justifica con una **regla**, y cada regla se puede abrir para ver por qué es cierta. El estudiante baja tanto como necesita:

```
Paso: 2x − 1 = 8x + 11  →  2x − 8x = 11 + 1
└─ ¿Por qué? Regla: lo que pasa al otro lado cambia de signo
   └─ ¿Por qué? Restar 8x en los dos lados mantiene la igualdad
      └─ ¿Por qué? Una igualdad es una balanza… → concepto: ecuaciones
         └─ ¿Te cuesta restar con negativos? → lección: ley de signos
```

- **Es contenido escrito a mano**, no generado. Las reglas son datos (`src/content/reglas.ts` o algo parecido). Cada nodo tiene:
  - `id`;
  - `texto`;
  - `latex` (opcional);
  - `concepto` (opcional);
  - `hijos` (la lista de nodos de abajo).
- **Varios motores comparten reglas.** Por ejemplo, "menos por menos da más" se usa en signos, en potencias y en ecuaciones.
- **Las hojas conectan con Aprender.** Las hojas más profundas apuntan a un concepto del mapa y a su lección, así el porqué termina en algo que se puede practicar.
- **Se ve como desplegables.** Cada nivel se abre con un "¿Por qué?". Así la pantalla del teléfono no se llena de texto.

## Animaciones: tokens y FLIP

### Lo que ya existe

- **Motion** para la interfaz (entradas, retroalimentación, marcas de bien y mal).
- **GSAP** para secuencias: el mapa del resultado y los saltos de la recta numérica.
- Siempre se respeta `prefers-reduced-motion`. Con movimiento reducido se muestra directamente el estado final (ver `src/ui/useReducedMotion.ts`).

### Tokens de movimiento (planeado)

Hoy las duraciones y curvas de animación están escritas en cada componente. La meta es moverlas a tokens, como ya están los colores y las letras en `src/styles/tokens.css`:

- **En CSS:** `--dur-rapida`, `--dur-media`, `--dur-lenta`, `--curva-entrada`, `--curva-salida`, `--curva-rebote`.
- **En TypeScript:** un módulo espejo (por ejemplo `src/ui/movimiento.ts`) para Motion y GSAP, con los mismos nombres y valores.
- **Regla:** ninguna animación nueva escribe una duración a mano; usa un token.

### FLIP para los pasos de Resolver (planeado)

Cuando un paso cambia la expresión, cada término **viaja** de su lugar anterior al nuevo. Así se ve que el 8x cruzó al otro lado y cambió de signo, en vez de que la línea se redibuje entera.

1. **First:** se mide la posición de cada término en la expresión de antes.
2. **Last:** se dibuja la expresión nueva y se mide otra vez.
3. **Invert:** se aplica a cada término el `transform` que lo devuelve a su lugar anterior.
4. **Play:** se anima hasta `transform: none`.

- **Identidad de los términos.** Funciona porque cada término tiene un `id` estable entre pasos (`Paso.terminos`). El motor decide qué término es "el mismo" de un paso a otro: es parte de la solución, no de la vista.
- **Términos que aparecen o desaparecen.** Los nuevos entran con opacidad y los que se cancelan salen tachados con la pluma roja.
- **Implementación:** se puede usar `layoutId` de Motion (que hace FLIP por dentro) o un FLIP propio con GSAP. Hay que decidir al construirlo.
- **Movimiento reducido:** sin desplazamiento, solo el cambio de estado.

## Diseño

La dirección visual es **"A · Cuaderno"**:

- **Fondo:** papel con cuadrícula azul claro y margen rojo.
- **Colores con significado:**
  - tinta azul `#1F3FBF` para enseñar;
  - rojo `#E0322B` para corregir;
  - resaltador `#F5E34A` para lo importante.
- **Letras:** Kalam (escrita a mano) para títulos y anotaciones, y Atkinson Hyperlegible para leer.
- **Lo que se evita:** el aspecto genérico de páginas hechas con IA. Nada de tarjetas iguales con sombra gris, degradados decorativos ni etiquetas en mayúsculas.
- **Diseño mobile-first.**
- **Accesibilidad:**
  - foco visible;
  - etiquetas para lectores de pantalla;
  - toda figura animada tiene su descripción en palabras.

## Estructura actual

```
src/
├─ engine/        Motor matemático
│                   · fracciones exactas
│                   · lector de respuestas
│                   · RNG con semilla
│                   · verificador
├─ content/       Mapa de conceptos (concepts.ts, grafo.ts) y generadores por tema
├─ diagnostic/    Máquina del diagnóstico adaptativo
├─ lessons/       Avance de lecciones (leccion.ts); cada lección en su carpeta
├─ storage/       Progreso versionado en localStorage
│                   · schema.ts valida y migra
│                   · también tiene codificar/decodificar para el código de exportación
├─ screens/       Inicio, Diagnóstico, Resultado, LeccionSignos
├─ ui/            Teclado, Responder, RectaNumerica (Mafs), MapaConceptos, Formula (KaTeX)…
└─ config/        site.ts: enlaces de los formularios externos (reportar error, sugerencias)
```

Tecnologías: Vite 8, React 19, TypeScript estricto (sin `enum`), Mafs, KaTeX, Motion, GSAP, Vitest y oxlint.

## Comandos

```bash
npm run dev      # servidor local (puerto 5173)
npm test         # Vitest
npm run lint     # oxlint
npm run build    # tsc -b y vite build → dist/
```

Antes de cada commit tienen que pasar sin errores:

- las pruebas;
- el lint;
- `tsc -b`.

## Forma de trabajo

- Se construye **por etapas**. Al terminar cada etapa se avisa para que el autor la pruebe antes de seguir.
- No se construyen fases futuras sin que se pidan.
- **Publicación pendiente.** Todavía no se publica el sitio, ni en Vercel ni en GitHub Pages, hasta que el autor lo pida. El workflow de Pages solo corre a mano.

## Fases

1. **Prototipo (hecho):**
   - mapa de conceptos;
   - diagnóstico;
   - mapa de resultado;
   - lección de ley de signos;
   - retroalimentación sin IA;
   - progreso local.
2. **Fase 2:**
   - lecciones de todas las bases;
   - pantalla para exportar e importar el progreso con un código;
   - sección **Resolver** con los primeros motores y el árbol del porqué. Esto es una propuesta: falta confirmar en qué fase entra.
3. **Fase 3:** simulacro cronometrado del examen de admisión de la USAC y uso sin internet (PWA).
4. **Fase 4:** precálculo, trigonometría, álgebra lineal y cálculo.
