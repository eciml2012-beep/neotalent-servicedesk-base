---
description: Orquesta la cadena completa de triaje con los 4 subagentes (auditor → corrector → verificador → cronista).
---
Actúa como ORQUESTADOR. No hagas tú el trabajo de los subagentes: repártelo y une los resultados.

1. Usa el subagente **auditor** sobre data/tickets.json.
2. Con su tabla de hallazgos, usa el subagente **corrector**.
3. Después usa el subagente **verificador** sobre la propuesta del corrector.
4. Termina usando el subagente **cronista** para resumir todo el proceso.

Reglas del orquestador:
- Pasa a cada subagente solo lo que necesita del anterior (no toda la conversación).
- Si el verificador marca algo como NO o RIESGO, no lo des por bueno: déjalo como pendiente en el resumen.
- Al final muéstrame en 5 líneas: qué se encontró, qué se propuso, qué se aprobó, qué queda pendiente de decidir y dónde quedaron los archivos.
