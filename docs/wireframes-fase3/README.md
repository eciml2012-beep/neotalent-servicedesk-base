# Wireframes de flujo — vista C (tras el rediseño del 24/09/2026)

Deck de 9 pantallas en baja fidelidad (gris, sin la piel índigo real) que recorre los flujos del
operador de triaje descritos en `docs/diseno.md` → "Flujo de pantallas" y el rediseño del
24/09/2026. No propone diseño nuevo: usa los datos reales de `data/tickets.json` para comprobar
que las reglas del spec se ven bien en pantalla.

Ábrelo sirviendo el repo (`python -m http.server 8000`, igual que la app) y visita
`docs/wireframes-fase3/wireframes.dc.html`. Flechas ← → para pasar de diapositiva.

## Mapa de pantallas

| # | Pantalla (slide) | Fuente en el repo |
|---|---|---|
| 0 | Diagrama de flujo | `docs/diseno.md` → "Flujo de pantallas" (rediseño 24/09/2026) |
| 1 | Bandeja + Ficha (vista C) | `docs/spec.md` R4/R1/R3/R5, `docs/diseno.md` (rediseño), `data/tickets.json` (SVD-4102) |
| 2 | Ficha en modo Corregir | `docs/spec.md` R5/R8/R9 (motivo de corrección obligatorio) |
| 3 | Ticket Sin clasificar | `docs/spec.md` R4 (sin Aceptar), casos límite, `data/tickets.json` (SVD-4143) |
| 4 | Notas del operador | `docs/spec.md` R9 (se añaden, no se editan ni se borran, sobreviven a Deshacer) |
| 5 | Nuevo ticket (modal) | `docs/spec.md` R10 (clasificador de reglas fijas, no IA; protección de datos personales) |
| 6 | Bandeja tras confirmar | `docs/spec.md` R4/R5/R6 (aviso sin exportar); incluye el ticket creado en el modal |
| 7 | Exportar | `docs/spec.md` R6/R10 (el export incluye los tickets creados a mano) |
| 8 | Métricas | `docs/spec.md` R7 |

## Qué cambió respecto a la versión de la Fase 3

- **Bandeja y Ficha ya no son dos pantallas.** Es un solo panel: lista a la izquierda, ficha del
  ticket elegido a la derecha, cada una con su scroll. Ya no hay "← Bandeja" que navegue a otra
  pantalla: la ficha simplemente se vacía.
- **Barra superior** en vez de rail lateral (estructura del rediseño índigo).
- **"Nuevo ticket"** (R10): formulario modal sobre la bandeja, con la misma protección de datos
  personales que las notas.
- **"Notas del operador"** (R9): panel dentro de la ficha, no una pantalla aparte.
- **Motivo de la corrección** (R9): campo nuevo en el modo Corregir, obligatorio si la corrección
  cambia la sugerencia de la IA.

## Revisión contra spec/diseño/constitución (24/09/2026)

Sin objeciones. Cada pantalla respeta lo ya decidido:

- **Principio 1** (la IA sugiere, la persona decide): sin botón "Aceptar todo"; en "Sin
  clasificar" no hay botón Aceptar, solo Corregir; el ticket creado a mano (R10) nace igual de
  pendiente que cualquier otro, aunque lo clasifique un motor de reglas y no una IA.
- **Sugerido vs. confirmado** distinto en borde (punteado / sólido), no solo en color.
- **Prioridad** siempre calculada por la matriz urgencia × impacto, nunca editable a mano.
- **R8**: con categoría "Brecha de seguridad activa" la urgencia queda bloqueada en Alta.
- El ticket cerrado SVD-4106 aparece igualmente en "Pendientes de confirmar" (spec, decisión 9).
- Toda sugerencia lleva su `motivo`, incluida "Sin clasificar" y la de R10 (reglas fijas).
- **Principio 3** (enmienda R9/R10): el aviso de datos personales está a la vista junto a cada
  campo de texto libre (notas, motivo de corrección, título y descripción del ticket nuevo).

Este deck no sustituye el lienzo de la Fase 2 (`docs/diseno.md`, estilo KirriDesk/índigo); es un
paso intermedio de bajo coste para validar el flujo antes de tocar HTML/CSS/JS definitivos.
