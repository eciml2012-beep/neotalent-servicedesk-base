# Revisión QA del spec — Paso 5 de la práctica

Revisión de `docs/spec.md` contra `docs/constitution.md`, hecha el 22/09/2026.
**Solo detecta, no propone soluciones.** Cada punto se decide en grupo y después se corrige el spec.

## Conflictos con la constitución

| # | Dónde | Qué choca |
|---|---|---|
| C1 | `docs/diseno.md` (tipografía IBM Plex) · Principio 6 | Si la fuente se carga desde Google Fonts, es una dependencia externa. La comprobación del principio solo menciona scripts, así que no queda claro si las fuentes externas están permitidas. |
| C2 | R4 · Principio 1 | La bandeja muestra categoría y prioridad antes de que el operador confirme. No está definido cómo se distingue en pantalla lo sugerido de lo confirmado, y el principio dice que nada queda clasificado sin confirmar. |
| C3 | R6 «Exportar» · Principio 2 | El principio prohíbe acciones fuera de la bandeja. Descargar un archivo es una acción fuera de la app, y no está dicho si cuenta. |
| C4 | Principio 3 | «Se revisa antes del commit» no dice quién revisa ni cómo se comprueba que un dato es ficticio. |

## Ambigüedades

| # | Dónde | Qué no está claro |
|---|---|---|
| A1 | R2, impacto «varias zonas» | Cada ticket tiene un solo campo `zona`. No está definido cómo sabría la IA que un ticket afecta a varias zonas. |
| A2 | R2, urgencia Media «hay alternativa» | El texto del ticket casi nunca dice si hay alternativa. La IA tendría que suponerlo, y la constitución le prohíbe inventar. |
| A3 | R1 y R3, «Sin clasificar» | No está definido si un ticket «Sin clasificar» lleva urgencia e impacto. R1 pide siempre los cuatro campos y R3 dice que no tiene prioridad. |
| A4 | R7, tasa de corrección | No está definido si corregir solo el impacto cuenta como «Corregido», ni si clasificar a mano un «Sin clasificar» entra en la tasa. |
| A5 | R4, estado del triaje de los tickets cerrados | Los cerrados no cuentan como pendientes, pero su estado seguiría siendo «Pendiente de confirmar» para siempre. |
| A6 | R6, del archivo exportado al repo | No está dicho quién mete el archivo exportado en `data/tickets.json`, ni cómo, sabiendo que el CLAUDE.md prohíbe reescribir tickets. |
| A7 | R1, «el motivo cita hechos del ticket» | No hay forma automática de comprobarlo. El criterio de finalización 1 solo comprueba que no esté vacío. |
| A8 | Decisiones 4, 5 y 6 | Se tomaron con la opción por defecto, sin debate. Están marcadas como pendientes de validar. |

## Casos límite no cubiertos

| # | Caso |
|---|---|
| L1 | Dos operadores confirman en navegadores distintos y exportan dos archivos diferentes. No está definido cuál vale. |
| L2 | Una sugerencia incoherente: categoría «Brecha de seguridad activa» con urgencia Baja. No hay regla que lo impida ni que lo avise. |
| L3 | El operador deshace un ticket después de exportar. El archivo exportado queda desactualizado sin aviso. |
| L4 | Se borra el `localStorage` (limpieza del navegador, modo incógnito) antes de exportar. Se pierde el trabajo sin aviso previo. |
| L5 | La matriz da «Crítica» pero el operador cree que no lo es. Solo puede cambiar urgencia o impacto, no la prioridad directamente. No está dicho si eso es intencionado. |
