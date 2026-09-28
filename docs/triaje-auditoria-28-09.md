# Auditoría del clasificador con un equipo de agentes — 28/09/2026

Registro de la primera corrida de la cadena `auditor → corrector → verificador → cronista`
(subagentes de `.claude/agents/`, invocables con `/triaje-completo`).

Qué se quería saber: **si el clasificador de reglas fijas coincide con la clasificación que ya
tiene el dataset**. Son dos cosas distintas que nunca se habían comparado — las `sugerencia` de
`data/tickets.json` las escribió Claude Code sobre el repo, mientras que
`js/utils/clasificador-nuevo-ticket.js` son reglas de palabras clave que solo actúan sobre los
tickets que una persona crea a mano en el navegador (R10).

## Qué hizo cada agente

| Agente | Herramientas | Resultado |
|---|---|---|
| **auditor** | solo lectura | 48 de 60 tickets (80%) coinciden. Encontró 12 divergencias y una contradicción entre el código y un documento |
| **corrector** | lectura + editar un archivo | Añadió 3 palabras clave a `clasificador-nuevo-ticket.js` |
| **verificador** | solo lectura | Confirmó los 8 casos, comprobó que nada se rompe y dejó 2 avisos |
| **cronista** | solo lectura | Redactó el relato del proceso, del que sale este documento |

Ninguno puede hacer `git commit` ni `git push`: eso queda fuera de la cadena, en manos de una
persona. El corrector es el único con permiso de escritura, y solo sobre un archivo.

## Lo que encontró el auditor

**Ocho tickets con hueco de vocabulario.** Su categoría en el dataset es correcta, pero su texto
no disparaba ninguna regla, así que el clasificador los habría dejado sin clasificar:

| Tickets | Lo que dice su texto | Categoría en el dataset |
|---|---|---|
| SVD-4110, 4125, 4140, 4155 | «sin respuesta», «no reconoce ninguna credencial» | Equipo de campo averiado |
| SVD-4111, 4126, 4141, 4156 | «corte de grabación», «se corta cada noche» | Pérdida de registro o evidencia |

**Cuatro tickets de cámara** (SVD-4113, 4128, 4143, 4158), que están como «Sin clasificar» y que
un cambio anterior del mismo día había hecho clasificables con las claves «sin grabar» y
«pantalla en negro».

**Desajustes de urgencia e impacto** en otros tickets, que nadie corrigió: «Falsa alarma
recurrente» con urgencia Media donde las reglas darían Baja, y «Petición de acceso» y «Pérdida de
registro» con impacto Bajo donde las reglas darían Medio o Alto.

## Lo que se corrigió

Tres claves nuevas en `js/utils/clasificador-nuevo-ticket.js`:

- `"sin respuesta"` → regla «Equipo de campo averiado».
- `"corte de grabación"` y `"corte de grabacion"` → regla «Pérdida de registro o evidencia».

El verificador comprobó ticket por ticket que los 8 salen ahora con la misma categoría, urgencia e
impacto que ya tenían en el dataset; que esas cadenas **no aparecen en ninguno de los otros 52
tickets**, así que ninguna categoría pierde nada por el orden de evaluación; y que ningún test
dependía de que esos textos quedaran sin clasificar.

## Lo que se revirtió, y por qué importa

Las claves «sin grabar» y «pantalla en negro» **se sacaron**. El auditor detectó que contradecían
una decisión cerrada del 23/09/2026, escrita en `docs/categorias-triaje.md`:

> **Decisión cerrada (23/09/2026):** se quedan como «Sin clasificar». Reclasificarlas como Equipo
> de campo averiado habría sido urgencia Alta […] pero habría dejado la app sin ningún ticket que
> enseñe el flujo de «Sin clasificar».

El texto de esos tickets es ambiguo a propósito: no permite saber si el equipo falla o si solo ha
dejado de guardar. La regla nueva afirmaba lo que el equipo ya había decidido que no se podía
afirmar. Un detalle lo confirma: el documento razonaba que esa categoría sería urgencia **Alta**,
mientras que la regla les ponía **Media** — ni siquiera coincidía con la lectura que se había
considerado y descartado.

Según la jerarquía documental del `CLAUDE.md`, el documento manda sobre el código. Queda un
comentario en `REGLAS` para que esas claves no se vuelvan a añadir sin leer antes la decisión.

## Qué quedó comprobado

- `npm test`: **288 tests en verde**, incluidos tres nuevos — uno que fija el patrón de cámara en
  «Sin clasificar» y dos para las claves añadidas.
- `data/tickets.json` **no se tocó**: los 60 tickets conservan su `sugerencia`, y los 4 de cámara
  siguen «Sin clasificar».
- Commits: `11de37b` (el cambio que después se revirtió en parte) y `783bcff` (la corrección final).

## Lo que sigue abierto

1. **Los desajustes de urgencia e impacto** del auditor: nadie ha decidido si está mal el dataset
   o están mal las reglas.
2. **`"sin respuesta"` es genérica**: un futuro «Central de alarmas sin respuesta» caería en
   «Equipo de campo averiado» cuando sería «Fallo de integración entre sistemas».
3. **`"corte de grabacion"` sin tilde** hoy no la usa ningún ticket; se dejó como red para lo que
   teclee un operador.

## Lo que enseña esta corrida

El hallazgo más útil no fue técnico. Un agente con permiso de escritura corrigió algo que **parecía
un error y era una decisión**. Lo que lo frenó no fue el agente: fue que la decisión estuviera
escrita, fechada y razonada en un documento del repositorio. Sin ese documento, la corrección
habría pasado por buena — y habría dejado la app sin el único caso que enseña la pantalla de
«Sin clasificar».
