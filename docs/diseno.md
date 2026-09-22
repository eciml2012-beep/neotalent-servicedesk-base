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

- **Bandeja** es la entrada. Abre con las 50 incidencias abiertas y se filtra por estado, sistema y zona.
- **Ficha** muestra una incidencia entera y vuelve siempre a la bandeja.
- **Panel de métricas** es solo lectura.
- Los 60 tickets se cargan una vez al abrir; filtrar o abrir una ficha no vuelve a pedir datos.

Queda fuera: login, alta de incidencias y edición del texto del ticket. La clasificación la hace
Claude Code sobre el repositorio, no el navegador: la pantalla la muestra, no la calcula.

## Las dos propuestas para la bandeja

| | **Opción A — tabla clara** | **Opción B — columnas por categoría, oscura** |
|---|---|---|
| Organización | Una tabla con todas las incidencias, ordenable por columna | Tres columnas, una por categoría de triaje, con tarjetas |
| Fondo | Hueso `#F4F3EF` | Azul grisáceo oscuro `#16202B` |
| Fuerte en | Buscar un ticket concreto, comparar filas, ver muchos datos a la vez | Decidir qué atender primero; la carga de trabajo se ve de un vistazo |
| Flojo en | No prioriza: 50 filas se parecen entre sí | Esconde el resto de categorías detrás de un «ver las 12» |

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

Entonces: se construye **A**, y la paleta de **B** queda como el tema oscuro de ese interruptor.

## Reglas visuales que se llevan a la Fase 3

- Tipografía IBM Plex Sans para todo; IBM Plex Mono solo para los identificadores (`SVD-4102`).
- Cuerpo de texto a 14 px, títulos de pantalla a 26 px. Nada por debajo de 12 px.
- Botones y campos de 44 px de alto, para que se acierten con el ratón sin apuntar.
- Color con significado, no de adorno: ámbar `#A5601A` para abierto, verde azulado `#1F6F6B`
  para cerrado y para las acciones, rojo terroso `#8A2F1E` solo para brecha de seguridad activa.
- Cada fila lleva su categoría de triaje debajo del título: es el dato que decide qué se atiende antes.
- Elementos reales de HTML (`<button>`, `<a>`, `<label>` con su campo), no `div` que parecen botones.

## Pendiente del spec (Fase 1)

La **prioridad** aparece en el diseño como hueco vacío a propósito. Sus valores no existen todavía
en `data/tickets.json` y se deciden en `docs/spec.md`. La categoría sí es real: sale de las siete
categorías de `docs/categorias-triaje.md`.
