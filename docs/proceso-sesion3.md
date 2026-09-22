# Proceso de la Sesión 3 — de la investigación al spec

Recorrido de la práctica «Constitución, referencias y spec» (22/09/2026), en el orden en que se
hizo. Cada paso dice qué se pidió, qué salió y dónde está.

| # | Paso | Qué hicimos | Resultado |
|---|---|---|---|
| 1 | Deep research | Partimos del informe repartido por Drive y de una segunda pasada. De 132 afirmaciones sobrevivieron 24 a la verificación. | `deep-research/` |
| 2 | Referencias visuales | Claude Code buscó en Dribbble y MotionSites con playwright, con 6 criterios de diseño. Paramos en 3 capturas y elegimos **KirriDesk**. | `assets/referencias/README.md` |
| 3 | Constitución | Claude nos hizo 6 preguntas de una en una. Salieron 6 principios, cada uno con su forma de comprobarse. | `docs/constitution.md` |
| 4 | Spec | Otras 6 preguntas de una en una. Matriz urgencia × impacto (3×3 → 4 prioridades), historias, requisitos, casos límite, fuera de alcance y criterios de finalización. | `docs/spec.md` |
| 5 | QA | Claude revisó el spec contra la constitución, solo detectando: 4 conflictos, 8 ambigüedades y 5 casos límite. | `docs/revision-qa-spec.md` |
| 6 | `/init` | Claude Code actualizó el `CLAUDE.md` con todo lo acordado, como contexto permanente. | `CLAUDE.md` |
| 7 | Subir | «Haz commit y push de estos cambios», en lenguaje natural. | historial de git |
| 8 | Resolver el QA | Se cerraron los 17 hallazgos más 3 que salieron de cruzar spec ↔ diseño. | `docs/revision-qa-spec.md`, con la resolución de cada uno |

## Las decisiones clave

- **Constitución:** la IA sugiere y la persona confirma; ninguna acción física; solo datos sintéticos; toda sugerencia con motivo; prioridad por matriz propia; stack plano sin instalar nada.
- **Spec:** la IA propone urgencia e impacto, y la matriz calcula la prioridad. La confirmación se guarda en el navegador y se exporta a JSON.
- **Referencia:** KirriDesk dibuja los principios 1 y 4: la sugerencia de la IA en su propio bloque, con explicación y botón «Accept & Send».
- **Diseño con KirriDesk:** se toma la estructura (navegación a la izquierda, paneles, sugerencia de la IA en su bloque con «Aceptar», «Corregir» y «Deshacer» fuera). La paleta de la Fase 2 no cambia: fondo hueso `#F4F3EF`, paneles `#FDFCFA`. Sin avatares ni caras, por el principio 3. Detalle en `docs/diseno.md`.
- **La tipografía cambió por el QA:** IBM Plex desde Google Fonts chocaba con el principio 6. Se
  usa la pila de fuentes del sistema, que además hace que la app funcione sin conexión.

## Lo que cambió al resolver el QA

Los tres hallazgos con más consecuencias:

- **El impacto ya no depende de «varias zonas»** —dato que el ticket no tiene— sino de una lista
  cerrada de tres zonas críticas: Perímetro exterior, Sala de servidores y Torre de control.
- **La urgencia ya no depende de «si hay alternativa»**, que el texto casi nunca dice. Ahora se
  decide solo con hechos observables en el ticket.
- **Los 10 tickets cerrados entran en «Pendientes de confirmar»**. El filtro por defecto de la
  bandeja pasó a ser por estado del triaje, no por estado del ticket: si no, nadie los confirmaba
  nunca y el criterio de finalización 1 los exigía.

Las preguntas 4, 5 y 6 del spec, que estaban pendientes de validar, quedaron confirmadas:
«Sin clasificar» para lo que no encaja, sugerencia para los 60 tickets, y los criterios de
finalización tal como estaban (ampliados a 9).

## Siguiente fase

Fase 3, desarrollo: Claude Code construye la bandeja a partir de `docs/spec.md`, cumpliendo `docs/constitution.md`.
