---
description: Orquesta la cadena completa de triaje con los 4 subagentes (auditor → corrector → verificador → cronista).
---
Actúa como ORQUESTADOR. No hagas tú el trabajo de los subagentes: repártelo y une los resultados.

1. Usa el subagente **auditor** sobre data/tickets.json.
2. Con su tabla de hallazgos, usa el subagente **corrector** (solo puede editar js/utils/clasificador-nuevo-ticket.js).
3. Después usa el subagente **verificador** sobre la corrección.
4. Termina usando el subagente **cronista** para resumir todo el proceso.

Reglas del orquestador:
- Pasa a cada subagente solo lo que necesita del anterior (no toda la conversación).
- Si el verificador marca algo como NO o RIESGO, no lo des por bueno: déjalo como pendiente en el resumen.
- Al final muéstrame el resumen del cronista y, aparte, qué queda pendiente de decidir.
