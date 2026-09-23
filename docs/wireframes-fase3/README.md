# Wireframes de flujo — previos a la Fase 3

Deck de 8 pantallas en baja fidelidad (gris, sin la piel de KirriDesk) que recorre los flujos del
operador de triaje descritos en `docs/diseno.md` → "Flujo de pantallas". No propone diseño nuevo:
usa los datos reales de `data/tickets.json` para comprobar que las reglas del spec se ven bien en
pantalla antes de escribir HTML/CSS/JS definitivos.

Ábrelo sirviendo el repo (`python -m http.server 8000`, igual que la app) y visita
`docs/wireframes-fase3/wireframes.dc.html`.

## Mapa de pantallas

| Pantalla (slide) | Fuente en el repo |
|---|---|
| Diagrama de flujo | `docs/diseno.md` → "Flujo de pantallas" |
| Bandeja (por defecto) | `docs/spec.md` R4, `docs/diseno.md`, `data/tickets.json` |
| Ficha del ticket | `docs/spec.md` R1/R3/R5, `docs/diseno.md` (caja IA), `data/tickets.json` (SVD-4102) |
| Ficha en modo Corregir | `docs/spec.md` R5/R8 (urgencia bloqueada), R3 (matriz) |
| Ticket Sin clasificar | `docs/spec.md` R4 (sin Aceptar), casos límite, `data/tickets.json` (SVD-4143) |
| Bandeja tras confirmar | `docs/spec.md` R4/R5/R6 (aviso sin exportar) |
| Exportar | `docs/spec.md` R6 |
| Métricas | `docs/spec.md` R7 |

## Revisión contra spec/diseño/constitución (22/09/2026)

Sin objeciones. Cada pantalla respeta lo ya decidido:

- **Principio 1** (la IA sugiere, la persona decide): sin botón "Aceptar todo"; en "Sin clasificar"
  no hay botón Aceptar, solo Corregir.
- **Sugerido vs. confirmado** distinto en borde (punteado / sólido), no solo en color.
- **Prioridad** siempre calculada por la matriz urgencia × impacto, nunca editable a mano — la
  pantalla de Corregir lo dice explícitamente.
- **R8**: con categoría "Brecha de seguridad activa" la urgencia queda bloqueada en Alta, con el
  motivo a la vista.
- El ticket cerrado SVD-4106 aparece igualmente en "Pendientes de confirmar" (spec, decisión 9).
- Toda sugerencia lleva su `motivo`, incluida "Sin clasificar".

Este deck no sustituye el lienzo de la Fase 2 (`docs/diseno.md`, estilo KirriDesk); es un paso
intermedio de bajo coste para validar el flujo antes de implementarlo.
