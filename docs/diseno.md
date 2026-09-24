# Diseño — Fase 2 (Sesión 3)

Decisiones de diseño del Mini Service Desk, hechas con el lienzo de Claude Design a partir del
dataset real (`data/tickets.json`) y de las categorías de `docs/categorias-triaje.md`.

Lienzo: https://claude.ai/artifact/JMVLzPXtQ7F65yz37xJfuB (privado; se comparte desde el menú Share)

## Flujo de pantallas

```
        clic en una fila                cerrar / volver
Bandeja ──────────────────> Ficha ──────────────────> Bandeja
   │
   │ enlace «Métricas» en la cabecera
   ▼
Panel de métricas ──> vuelve a Bandeja
```

- **Bandeja** es la entrada. Abre con los **pendientes de confirmar** —abiertos y cerrados, los 60
  entran en el triaje— y se filtra por estado, sistema, zona, prioridad y estado del triaje.
  Abrirla filtrada a «abiertos» dejaría los 10 cerrados sin ninguna vista donde confirmarlos
  (spec, decisión 9).
- **Ficha** muestra una incidencia entera y vuelve siempre a la bandeja.
- **Panel de métricas** es solo lectura.
- Los 60 tickets se cargan una vez al abrir; filtrar o abrir una ficha no vuelve a pedir datos.

- **Ficha, modo ver**: a la izquierda los datos del ticket y debajo el panel **Notas del
  operador** (spec R9): notas con fecha, en orden, y un campo para añadir otra. A la derecha la
  caja de la IA y las acciones.
- **Ficha, modo corregir**: los tres desplegables, la prioridad recalculada y el campo **Motivo de
  la corrección**, obligatorio si lo guardado difiere de la IA (R9).

Queda fuera: login, alta de incidencias y edición del texto del ticket: el operador **anota**,
no reescribe lo reportado (spec, decisión 25). La clasificación la hace
Claude Code sobre el repositorio, no el navegador: la pantalla la muestra, no la calcula.

Wireframes de baja fidelidad de estas pantallas, revisados contra el spec: `docs/wireframes-fase3/`.

## Las dos propuestas para la bandeja

| | **Opción A — tabla clara** | **Opción B — columnas por categoría, oscura** |
|---|---|---|
| Organización | Una tabla con todas las incidencias, ordenable por columna | Tres columnas, una por categoría de triaje, con tarjetas |
| Fondo | Hueso `#F4F3EF` | Azul grisáceo oscuro `#16202B` |
| Fuerte en | Buscar un ticket concreto, comparar filas, ver muchos datos a la vez | Decidir qué atender primero; la carga de trabajo se ve de un vistazo |
| Flojo en | No prioriza: 50 filas se parecen entre sí | Solo caben 3 de las 7 categorías; las otras 4 quedan detrás de un «ver todas» |

La ficha y el panel de métricas sirven igual para las dos.

## Decisión: A como pantalla por defecto, con interruptor a modo oscuro

El equipo mira esto ocho horas al día, así que la comodidad manda sobre el efecto visual.
Lo que dice la evidencia sobre sesiones largas:

- **El modo oscuro no es mejor por sí mismo.** Ayuda con poca luz y en salas de monitorización;
  con luz de oficina, el modo claro se lee mejor, sobre todo en pantallas con mucho texto. Como
  esta bandeja es texto en su mayoría y se usa de día, A es el punto de partida.
- **Lo que de verdad cansa son los extremos.** Ni blanco puro ni negro puro. Por eso A usa hueso
  `#F4F3EF` en lugar de `#FFFFFF`, y B usa `#16202B` en lugar de `#000000`: el negro puro con texto
  claro produce halación y fatiga a partir de la media hora.
- **Contraste según WCAG AA:** 4.5:1 en texto normal y 3:1 en texto grande y controles. El gris
  claro de las leyendas y los rellenos suaves bajo texto blanco son los que suelen fallar.
- **La respuesta buena es dejar elegir.** Un interruptor claro/oscuro en la cabecera, que recuerde
  la preferencia, cubre al que trabaja de día y al turno de noche sin discutir cuál es mejor.
  La preferencia se guarda en `localStorage` bajo la clave `svd-tema`, separada de `svd-triaje`,
  que es donde van las confirmaciones (spec, R6). Son dos cosas distintas y no comparten clave.

Entonces: se construye **A**, y la paleta de **B** queda como el tema oscuro de ese interruptor.

## Reglas visuales que se llevan a la Fase 3

- Tipografía: **pila del sistema**, sin descargar fuentes. Cargar IBM Plex desde Google Fonts
  sería una dependencia externa y lo prohíbe el principio 6 de la constitución.
  - Texto: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
  - Identificadores (`SVD-4102`): `ui-monospace, "Cascadia Mono", Consolas, monospace`.
- Cuerpo de texto a 14 px, títulos de pantalla a 26 px. Nada por debajo de 12 px.
- Botones y campos de 44 px de alto, para que se acierten con el ratón sin apuntar.
- Color con significado, no de adorno: ámbar `#A5601A` para abierto, verde azulado `#1F6F6B`
  para cerrado y para las acciones, rojo terroso `#8A2F1E` solo para brecha de seguridad activa.
- Cada fila lleva su categoría de triaje debajo del título: es el dato que decide qué se atiende antes.
- **Sugerido y confirmado no se ven igual.** Mientras el ticket esté `Pendiente de confirmar`, su
  categoría y su prioridad van atenuadas, con borde punteado y la palabra «sugerido» al lado.
  Al confirmar o corregir pasan a sólido. El color nunca es la única diferencia: también cambia
  el borde, para no depender de distinguir tonos (spec R4, constitución principio 1).
- Elementos reales de HTML (`<button>`, `<a>`, `<label>` con su campo), no `div` que parecen botones.

## Estilo elegido: la piel de KirriDesk sobre la paleta de la Fase 2

Referencia: `assets/referencias/dribbble/captura-2.png`. Decidido el 22/09/2026 en grupo.
Se aplica a **toda la app**, no solo a la ficha. Se toma la **estructura**; la paleta y la
tipografía siguen siendo las de arriba.

### Qué se copia de la referencia

- **Carril de navegación fijo a la izquierda**, con las secciones agrupadas bajo etiquetas
  cortas en mayúsculas pequeñas. La sección activa se marca con un relleno suave, no con color.
- **El contenido vive en paneles** sobre el fondo, con borde de 1 px y esquinas suaves. El
  fondo se ve entre los paneles: es lo que da el aire.
- **Cabecera de pantalla en una línea**: volver, el id en monoespaciada (`SVD-4102`), el título,
  y la acción primaria pegada a la derecha.
- **Pestañas bajo la cabecera** para las vistas de un mismo ticket, con subrayado en la activa.
- **Un solo color de acción por pantalla.** Todo lo demás es gris. La referencia usa verde para
  lo accionable y negro para el botón primario, y no usa color en ningún otro sitio.
- **Densidad sin apretar**: filas compactas, pero con separadores finos y no líneas de tabla.

### La regla que de verdad importa

**La sugerencia de la IA va dentro de un bloque delimitado, con su propio fondo y su borde. Las
acciones de la persona van fuera del bloque.**

En la referencia, la propuesta de la IA está en una caja verde clara con su explicación dentro
y un «Was this helpful?» en la esquina; el botón «Accept & Send» está fuera, abajo, en la barra
de acciones. Se ve sin leer nada dónde acaba lo que propone la máquina y dónde empieza lo que
decide la persona. Eso es el principio 1 de la constitución dibujado, y el R5 del spec.

Traducido a nuestra bandeja: el `motivo` y la categoría sugerida se pintan dentro de la caja.
«Aceptar», «Corregir» y «Deshacer» se pintan fuera. Nunca al revés.

Lo que escribe la persona tampoco va dentro de la caja de la IA: las notas tienen su propio panel
junto a los datos del ticket. La única excepción es el **motivo de la corrección**, que se enseña
en la caja de un `Corregido` junto a la «Sugerencia original de la IA», porque es la respuesta
directa a esa sugerencia y se lee mejor al lado.

### Qué no se copia

| De la referencia | Qué hacemos | Por qué |
|---|---|---|
| Fondo gris azulado frío | Hueso `#F4F3EF` | Decisión de la Fase 2, tomada por la fatiga en turnos de ocho horas. Los dos evitan el blanco puro; se mantiene el que ya estaba razonado |
| Paneles en blanco puro `#FFFFFF` | Hueso más claro `#FDFCFA` | Misma razón: ningún plano grande en blanco puro. El contraste con el fondo sigue siendo suficiente para separar el panel |
| Verde brillante de acción | Verde azulado `#1F6F6B` | Ya era el color de las acciones en la Fase 2 |
| Botón primario negro | Verde azulado `#1F6F6B` | El negro sólido sobre hueso pesa demasiado en una pantalla que se mira todo el día |
| Avatares y fotos de persona | Nada | Principio 3: solo datos sintéticos, tampoco caras |

## Rediseño del 24/09/2026: vista C con paleta índigo

**Decidido por el equipo el 24/09/2026. Sustituye a la paleta de la Fase 2 y al rail lateral de
KirriDesk.** De KirriDesk se mantiene la idea principal: la lista y el ticket a la vista a la vez,
y la caja de la IA separada de las acciones de la persona. Prototipo aprobado:
`vista C, índigo` (60 tickets reales, scroll independiente).

### Estructura: bandeja con la ficha al lado

```
┌ barra: marca · Bandeja | Métricas · aviso · Exportar JSON · Tema ─── fija ┐
├ filtros en una línea ─────────────────────────────────────────── fija ┤
├ lista (400 px) ─────────┬ ficha del ticket seleccionado ─────────────┤
│ scroll propio           │ scroll propio; vuelve arriba al cambiar     │
└─────────────────────────┴───────────────────────────────────────────┘
```

- La página no hace scroll: lo hacen la lista y la ficha, cada una por separado.
- Elegir un ticket lo abre al lado y cambia la dirección a `#/ticket/:id` (se puede recargar y
  compartir).
- **Aceptar pasa al siguiente pendiente**; la lista se desplaza solo si no se ve, y **no pierde
  su posición** al repintar.
- Teclado: ↑ y ↓ recorren la lista y actualizan la ficha; Tab pasa a la ficha.
- Menos de 900 px: una sola columna. La ficha sustituye a la lista y vuelve con «← Bandeja».

### Paleta índigo (WCAG AA en los dos temas, peor par 5,2:1)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| fondo | `#F2F4F7` | `#0E131B` | Fondo de la app |
| panel | `#FBFCFD` | `#161D28` | Lista, ficha, barra |
| borde | `#D9DEE5` | `#2A3444` | Separadores |
| texto | `#172030` | `#E6EAF0` | Texto |
| tenue | `#5B6576` | `#9AA6B8` | Etiquetas, sugerido |
| acción | `#3A4BC4` | `#9AA8FF` | Un solo color de acción, selección |
| abierto | `#9A5B00` | `#F0A93B` | Estado abierto y avisos |
| brecha | `#B3261E` | `#FF8A7A` | Solo «Brecha de seguridad activa» |

Siguen igual: pila de fuentes del sistema, ids en monoespaciada, 44 px en controles, 12 px como
mínimo, foco visible y sugerido con borde discontinuo frente a confirmado con borde sólido.

### Prioridad por peso, no por color

«Crítica» es una píldora rellena de tinta; «Alta», contorno fuerte; «Media», contorno fino;
«Baja», gris. Ordena la vista sin añadir colores con significado nuevo.

### Qué cambia respecto a lo anterior

- Sin mayúsculas espaciadas en las etiquetas («Datos del ticket», no «DATOS DEL TICKET»).
- Barra superior en lugar del rail lateral.
- «Exportar JSON» en lugar de «Exportar ↓».

**Aplicado el 24/09/2026** en `css/styles.css`, `js/app.js` y los componentes. Tras decidir un
ticket, la app pasa al siguiente pendiente (`#/ticket/:id`) o a `#/bandeja` si no quedan;
«Deshacer» se queda en el mismo ticket. La fila seleccionada usa un color fijo (`--color-seleccion`,
≥ 4,9:1 con todo su texto) en lugar de una mezcla, para que el contraste se pueda medir.
Las 11 capturas de `@visual` están regeneradas y **pendientes de aprobar en la UAT**.

## Pendiente del spec (Fase 1)

La **prioridad** aparece en el diseño como hueco vacío a propósito. Sus valores no existen todavía
en `data/tickets.json` y se deciden en `docs/spec.md`. La categoría sí es real: sale de las siete
categorías de `docs/categorias-triaje.md`.
