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

La app tiene dos secciones, con una barra de navegación abajo en el teléfono: **Resolver** y **Aprender**. Comparten el mapa de conceptos (`src/content/concepts.ts`).

### Resolver: la sección principal (en construcción)

Es para el estudiante que tiene un problema **hoy**, por ejemplo uno de la tarea o de una guía de examen. Lo escribe y la app:

1. **Lo resuelve paso a paso**, con animaciones: las partes de la expresión se deslizan de un paso al siguiente (ver [FLIP](#flip-para-los-pasos-de-resolver)).
2. **Explica el porqué de cada paso** en una o dos frases.
3. **Árbol del porqué.** Cada paso trae botones con los temas que usa ("Ley de signos", "Sumar fracciones"). Un botón abre una mini lección ahí mismo; desde ella se puede bajar a temas más básicos (los prerrequisitos del mapa) y volver al problema. Ver [Árbol del porqué](#árbol-del-porqué).
4. **Lo muestra de forma visual** cuando se puede: recta numérica, balanza o gráfica.
5. **"Revisar mi respuesta".** El estudiante escribe lo que le dio y reglas escritas a mano reconocen el error típico.
6. **"Practicar uno igual".** Genera un ejercicio con la misma forma y otros números.

- **Cómo entra el problema:** con MathLive (aprobado), un campo matemático con teclado virtual para el celular, o tocando un ejemplo.
  - MathLive se carga solo en Resolver, sin sonidos y sin fuentes propias (usa las de KaTeX).
  - Siempre hay un campo de texto simple de respaldo: se usa mientras MathLive carga, si tarda más de 8 segundos o si falla.
  - En la computadora se escribe con el teclado físico.
- **Seguridad:** el problema que llega en la URL (`?p=`) es texto no confiable.
  - Nunca se inserta como HTML: siempre pasa por el parser (`src/expr/parse.ts`), que solo acepta una lista cerrada de símbolos.
  - Lo que se dibuja con KaTeX o se le pasa a MathLive sale del AST, no del texto crudo.
  - Si no se puede leer, se muestra como texto plano. Hay pruebas de esto en `src/expr/expr.test.ts`.
- **Números mixtos:** nunca se interpretan desde texto como "1 1/2", porque chocan con la multiplicación implícita. Solo se aceptan con la forma explícita `\mixto{1}{1}{2}` (la tecla 1½ del teclado matemático). Si alguien escribe "1 1/2", la app pregunta qué quiso decir.
- **Convenciones matemáticas:**
  - −3² = −9 y (−3)² = 9. Al escribir −3² se muestra una nota.
  - La multiplicación sin signo tiene la misma prioridad que la de con signo: 6 ÷ 2(1 + 2) = 9. Se muestra una nota que dice que algunos libros y calculadoras dan 1 y recomienda usar paréntesis.
  - "3/4" entre dos números es una fracción y se agrupa primero: 6 ÷ 3/4 = 8.
  - División entre cero: "no está definido".
  - Decimales: todavía no se aceptan. **Siguiente mejora**, porque son comunes en el examen de admisión de la USAC.
- **Ecuaciones:** la explicación principal es "hacer lo mismo en los dos lados", con la balanza. "Pasa al otro lado con el signo contrario" solo aparece como atajo, en una nota. Los generadores de Aprender enseñan lo mismo.
  - Orden de los pasos: quitar paréntesis y repartir fracciones, multiplicar los dos lados por el mcm para quitar fracciones, juntar términos parecidos, llevar la letra a la izquierda, llevar los números a la derecha y dividir entre el número que acompaña a la letra.
  - Los tres casos: una solución, sin solución (queda algo como 0 = 5) e infinitas soluciones (0 = 0). Cada uno se explica en palabras y con la balanza (inclinada si nunca se cumple).
  - La comprobación se le muestra al estudiante: el número en lugar de la letra en la ecuación original, y cuánto da cada lado. En los casos sin solución o infinitas, se prueba con dos números.
  - Lo que no es lineal (x², x·x, x en el denominador, dos letras, x en un exponente, expresión sin =) se rechaza con su razón y se ofrece el tema más cercano.
- **Diseño adaptable:** funciona en celular, tablet y computadora. En pantallas grandes se aprovecha el espacio (por ejemplo, los pasos y la visual lado a lado). Cada etapa se prueba en los tres tamaños.
- **Si no lo reconoce:** lo dice con claridad y ofrece el tema más cercano en Aprender. **Nunca inventa un resultado.**
- **Verificación antes de mostrar:** todo resultado se comprueba de forma independiente, por ejemplo sustituyendo la solución en la ecuación. Si la comprobación falla, no se muestra la solución.
- **Motores hechos:**
  1. Aritmética: enteros, ley de signos, fracciones y jerarquía de operaciones.
  2. Ecuaciones lineales con una incógnita, con balanza visual.

### Aprender: la sección secundaria (existe, fase 1)

Es lo que se construyó primero. Se queda igual, pero ya no es la portada:

1. **Diagnóstico adaptativo.** Son 12 preguntas como máximo. Recorre el mapa de conceptos: si fallas un tema baja a sus prerrequisitos, y si lo dominas sube.
   - Código: `src/diagnostic/machine.ts` y `src/screens/Diagnostico.tsx`.
2. **Mapa y ruta.** Mapa animado con lo dominado, lo que ya puedes aprender y lo bloqueado, más la ruta recomendada.
   - Código: `src/screens/Resultado.tsx` y `src/ui/MapaConceptos.tsx`.
3. **Lecciones.** Por ahora existe una sola, ley de signos (`src/lessons/ley-de-signos/`). Sigue este orden: exploración visual → ejemplo guiado → práctica generada → mini prueba que desbloquea lo siguiente.

## Navegación (aprobada, hecha en la etapa 1)

Rutas por hash:

| Ruta | Pantalla | Pestaña |
| --- | --- | --- |
| `#/` | Resolver: escribir el problema | Resolver |
| `#/resolver?p=<problema>` | La solución paso a paso | Resolver |
| `#/resolver?p=<problema>&tema=signos,enteros` | Mini lección abierta (la pila de temas va en la ruta) | Resolver |
| `#/aprender` | La portada que antes era el inicio | Aprender |
| `#/diagnostico`, `#/resultado`, `#/leccion/<id>` | Igual que ahora | Aprender |

- El problema va en la ruta. Así el botón "atrás" del teléfono funciona y un problema se puede compartir como enlace. No se guarda en ningún servidor.
- La mini lección es una hoja que sube desde abajo. "Atrás" la cierra o vuelve al tema anterior.
- La barra de secciones va abajo en el teléfono y arriba desde 48rem (tablet y computadora). Se esconde mientras el teclado matemático está abierto.
- `#/dev/flip` es una prueba de la animación FLIP que solo existe con `npm run dev`.

## Arquitectura de Resolver (aprobada; el núcleo está hecho desde la etapa 1)

No hay un sistema de álgebra general. Hay **un motor pequeño por tipo de problema**. Agregar un motor es agregar una carpeta: el registro los encuentra solo con `import.meta.glob`, sin tocar nada más.

```
src/
├─ expr/            Núcleo compartido nuevo
│                     · ast.ts       tipos del árbol (Nodo)
│                     · parse.ts     texto o LaTeX de MathLive → AST, con avisos
│                     · evaluar.ts   valor exacto con Fraction
│                     · tokens.ts    AST → tokens con clave estable, y AST → LaTeX
│                     · construir.ts atajos para armar árboles con ids elegidos
│                     · sustituir.ts pone un número en lugar de la letra (la comprobación que ve el estudiante)
├─ motores/
│  ├─ tipos.ts      Motor, Solucion, Paso, Frame, Visual
│  ├─ registro.ts   despachador: usa el primer motor que detecta el problema y verifica
│  ├─ cercano.ts    tema más cercano y la razón en palabras (porQueNo) cuando ningún motor puede
│  ├─ aritmetica/   motor.ts, pasos.ts (pasos y su porqué), numeros.ts, errores.ts, parecido.ts, motor.test.ts
│  ├─ cambiar.ts    cambia los números de un problema y conserva su forma (practicar uno igual)
│  └─ ecuacion-lineal/ lineal.ts (términos y por qué no es lineal), pasos.ts (balanza), errores.ts, motor.ts, motor.test.ts
├─ content/mini/    mini lecciones del árbol del porqué, una por concepto (index.ts las junta)
├─ resolver/       CampoProblema (MathLive + texto de respaldo), mathlive.ts (carga y teclado),
│                    VisorPasos, RevisarRespuesta, CajaResultado (resultado y comprobación),
│                    HojaTema (mini lección), temas.ts (lee ?tema=)
└─ screens/Resolver.tsx, screens/Solucion.tsx, ui/ExpresionAnimada.tsx, ui/BarraSecciones.tsx
```

Interfaz de cada motor:

```ts
type Motor<P> = {
  id: string                                  // 'aritmetica', 'ecuacion-lineal'
  prioridad: number                           // el despachador prueba de menor a mayor
  detectar(ast: Nodo): P | null               // ¿es mío? Por estructura, no por texto
  resolver(p: P): Solucion
  comprobar(p: P, s: Solucion): boolean       // verificación independiente del resultado
  revisar(p: P, respuesta: string): Revision  // "Revisar mi respuesta": correcto o error típico
  expresion(p: P): Nodo                       // el AST del problema
  parecido(p: P, semilla: number): P | null   // "Practicar uno igual"; null si no halló uno sencillo
}

type Solucion = { pasos: Paso[]; resultado: Resultado }
// Resultado: un valor exacto, x = valor, "sin solución", "infinitas soluciones"
// o "no está definido" (división entre cero)

type Paso = {
  titulo: string                              // "Multiplica primero"
  explicacion: string                         // el porqué, en una o dos frases
  frames: Frame[]                             // normalmente antes y después
  conceptos: ConceptoId[]                     // botones del árbol del porqué
  visual?: Visual                             // recta, balanza o gráfica
}

type Frame = { expr: Nodo; resaltar?: string[] }
// Cada nodo del AST lleva un id estable. Los tokens salen del AST y su clave es ese id.
```

- **El AST manda.** Cada frame guarda la expresión como AST, no solo como dibujo. Así las pruebas evalúan cada frame y comprueban que el valor no cambia entre pasos.
- **Identidad de los términos.** El motor decide qué término es "el mismo" de un paso a otro dándole el mismo id. Es parte de la solución, no de la vista.
- **Núcleo que se reutiliza:** `engine/fraction.ts`, `engine/rng.ts`, `engine/parse.ts` (para leer respuestas) y `engine/verify.ts` (reglas generales de error: signo y fracción volteada).
- **Relación con los generadores (meta, pendiente).** Los errores comunes de `src/content/generators/*.ts` deberían pasar al `revisar` de cada motor como reglas, sin duplicarse. Hoy no es así: el motor de aritmética tiene sus reglas en `motores/aritmetica/errores.ts` (calcula el problema con un solo error, sobre el AST) y los generadores calculan sus errores en cada plantilla. Unificarlos es un cambio grande: pedir aprobación antes.
- **El porqué del orden.** Cada paso de una operación dice por qué va en ese momento (paréntesis, potencias, multiplicar antes de sumar, izquierda a derecha). Lo calcula `porQueAhora` en `pasos.ts`, y en ese caso el paso también ofrece el botón de "Orden de las operaciones".
- **Revisar mi respuesta.** Cada error típico es una forma equivocada de calcular, por ejemplo ir de izquierda a derecha sin jerarquía o sumar numeradores con numeradores y denominadores con denominadores. Si la respuesta del estudiante coincide con una, se explica ese error y se señala el paso donde se separó del camino correcto.
- **Practicar uno igual.** Cambia los números del AST con una semilla y conserva la forma. Repite hasta que el resultado sea sencillo: sin división entre cero y con denominadores pequeños.
- **Pruebas por motor** (Vitest), con muchas semillas:
  - el resultado coincide con la evaluación independiente;
  - cada paso conserva el valor de la expresión, o el conjunto solución de la ecuación;
  - casos borde: negativos, fracciones, ceros, división entre cero, ecuaciones sin solución o con infinitas soluciones;
  - no detecta problemas que no son suyos (por ejemplo, x² = 4 no es una ecuación lineal).

## Árbol del porqué

Cada paso tiene botones con los conceptos que usa. Cada botón abre la **mini lección** de ese concepto:

```
Paso: 2x − 1 = 8x + 11  →  2x − 8x = 11 + 1
  [Ecuaciones lineales] [Ley de signos]
        └─ Mini lección: Ley de signos
           · la regla en una frase y un ejemplo
           · 2 o 3 ejercicios cortos para probar
           · ¿Te cuesta? Baja a: [Números enteros]   ← prerrequisitos del mapa
           · Abrir la lección completa en Aprender    ← si existe
           · Volver al problema
```

- **El árbol es el mapa de conceptos.** Bajar es ir a los prerrequisitos de `concepts.ts`. No hay otro grafo.
- **Es contenido escrito a mano**, en `src/content/mini/<concepto>.ts`. Los ejercicios cortos salen de los generadores que ya existen.
- **Se ve como una hoja** que sube desde abajo, con una fila de migas ("Ley de signos › Enteros") para volver.

## Animaciones: tokens y FLIP

### Lo que ya existe

- **Motion** para la interfaz (entradas, retroalimentación, marcas de bien y mal).
- **GSAP** para secuencias: el mapa del resultado y los saltos de la recta numérica.
- Siempre se respeta `prefers-reduced-motion`. Con movimiento reducido se muestra directamente el estado final (ver `src/ui/useReducedMotion.ts`).

### Tokens de movimiento (hechos en la etapa 1)

Hoy las duraciones y curvas de animación están escritas en cada componente. La meta es moverlas a tokens, como ya están los colores y las letras en `src/styles/tokens.css`:

- **En CSS:** `--dur-rapida`, `--dur-media`, `--dur-lenta`, `--dur-pausa` (tiempo para leer un momento de un paso), `--curva-entrada`, `--curva-salida`, `--curva-rebote`.
- **En TypeScript:** un módulo espejo (por ejemplo `src/ui/movimiento.ts`) para Motion y GSAP, con los mismos nombres y valores.
- **Regla:** ninguna animación nueva escribe una duración a mano; usa un token. Las animaciones viejas se pasan a tokens cuando se toquen.

### FLIP para los pasos de Resolver (hecho en la etapa 1: `src/ui/ExpresionAnimada.tsx`)

Cada frame se dibuja como una lista de tokens con clave estable. Al pasar de un frame al siguiente, cada token **viaja** de su lugar anterior al nuevo. Así se ve que el 8x cruzó al otro lado y cambió de signo, en vez de que la línea se redibuje entera.

1. **First:** se mide la posición de cada token en el frame de antes.
2. **Last:** se dibuja el frame nuevo y se mide otra vez.
3. **Invert:** se aplica a cada token el `transform` que lo devuelve a su lugar anterior.
4. **Play:** se anima hasta `transform: none`.

- **Implementación:** `layout="position"` y `layoutId` de Motion dentro de un `LayoutGroup` por expresión. No agrega peso.
- **Tokens que aparecen o desaparecen:** los nuevos entran con fade; los que se cancelan salen tachados con la pluma roja.
- **Fracciones:** un token de fracción tiene su numerador y su denominador como tokens hijos, para que un número pueda subir o bajar.
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
├─ expr/          Parser → AST, evaluador exacto, tokens y LaTeX (Resolver)
├─ motores/       Contrato de motores, despachador con verificación, tema cercano
├─ resolver/      Campo para escribir el problema, visor de pasos, revisar mi respuesta y la hoja de mini lección
├─ screens/       Resolver, Solucion, Inicio (portada de Aprender), Diagnóstico, Resultado, LeccionSignos
├─ ui/            BarraSecciones, ExpresionAnimada, movimiento.ts, Teclado, Responder, RectaNumerica (Mafs), MapaConceptos, Formula (KaTeX)…
└─ config/        site.ts: enlaces de los formularios externos (reportar error, sugerencias)
```

Tecnologías: Vite 8, React 19, TypeScript estricto (sin `enum`), Mafs, KaTeX, MathLive, Motion, GSAP, Vitest y oxlint.

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
- **Un solo hilo de trabajo a la vez.** En Resolver se construye un motor a la vez, con las pruebas pasando, y se avisa para probarlo.
- **Si algo falta o no se puede, se dice exactamente qué y se para.** No se inventa ni se simula.
- **Se revisa que el contenido matemático sea correcto.**
- **Se pide aprobación al autor antes de:**
  - cambiar la arquitectura, o borrar o reescribir partes grandes del código;
  - agregar una dependencia nueva (con el porqué, cuánto pesa y si tiene costo o licencia restrictiva);
  - usar cualquier servicio externo, API o base de datos, o algo que pueda costar dinero;
  - recolectar cualquier dato de usuarios;
  - publicar en internet o cambiar la configuración del repositorio;
  - reescribir el historial de git o borrar ramas;
  - manejar claves o secretos (nunca se suben al repositorio).
- **Este archivo se actualiza al terminar cada etapa.**
- **Publicación pendiente.** Todavía no se publica el sitio, ni en Vercel ni en GitHub Pages, hasta que el autor lo pida. El workflow de Pages solo corre a mano.

## Fases

1. **Prototipo (hecho):**
   - mapa de conceptos;
   - diagnóstico;
   - mapa de resultado;
   - lección de ley de signos;
   - retroalimentación sin IA;
   - progreso local.
2. **Fase 2: Resolver (hecha; falta que el autor la pruebe).** Va por etapas, y cada una se prueba antes de seguir:
   1. **(Hecha)** Núcleo y navegación: parser → AST, evaluador exacto, despachador, tokens y FLIP, barra Resolver / Aprender y entrada del problema. Sin motores todavía: todo problema dice "todavía no sé resolverlo".
   2. **(Hecha)** Motor de aritmética: pasos animados, recta numérica, revisar mi respuesta, practicar uno igual y las mini lecciones de sus conceptos.
   3. **(Hecha)** Motor de ecuaciones lineales: balanza, casos sin solución o con infinitas soluciones y su mini lección.
3. **Después de Resolver:**
   - decimales en los motores (siguiente mejora, por el examen de la USAC);
   - portada y pantallas de Aprender aprovechando el ancho en tablet y computadora;
   - lecciones completas de todas las bases en Aprender;
   - pantalla para exportar e importar el progreso con un código.
4. **Fase 3:** simulacro cronometrado del examen de admisión de la USAC y uso sin internet (PWA).
5. **Fase 4:** precálculo, trigonometría, álgebra lineal y cálculo.
