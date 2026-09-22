---
name: restricciones-triaje-ia
description: Restricciones de diseño para el triaje con IA del Mini Service Desk, derivadas del deep research en deep-research/deep-research-triaje-ia-seguridad-fisica.md. Úsalo al escribir docs/spec.md o docs/diseno.md, al decidir cómo clasifica la IA prioridad/categoría, al diseñar la pantalla de triaje, o al fijar criterios de aceptación del clasificador. Incluye qué está respaldado por evidencia y qué el equipo tiene que decidir por su cuenta.
---

# Restricciones de diseño del triaje con IA

Derivadas de `deep-research/deep-research-triaje-ia-seguridad-fisica.md`. Lee el informe completo si necesitas la cita
exacta o la metodología; aquí están solo las decisiones accionables.

Cada regla lleva su estado de evidencia. **No presentes como respaldado por investigación
algo marcado [Sin evidencia]** — decláralo como decisión del equipo.

## Reglas no negociables

**R1. La IA sugiere, la persona confirma.** El modelo propone categoría, prioridad y
urgencia; nada se persiste sin un clic explícito de la persona que triaje. Es el patrón que
usa Freshservice con su Ticket Field Suggester. **[Verificado]**

**R2. Ninguna consecuencia física se ejecuta automáticamente.** Cerrar o abrir una
credencial, notificar a un guardia, escalar una alarma a intervención — nada de eso se
dispara desde una clasificación sin que una persona con capacidad real de anularla lo
confirme antes. El rol de la IA termina en la etiqueta del ticket. **[Verificado en sus
tres piezas; la aplicación concreta a "cerrar una credencial" es [Interpretación]]**

**R3. La pantalla de triaje cumple las 4 condiciones del EDPS** para que la supervisión
humana sea real y no nominal: **[Verificado]**
1. Anular la sugerencia sin fricción.
2. Mostrar *por qué* el sistema sugirió eso, no solo la etiqueta.
3. No aceptar por defecto — la persona actúa, no confirma pasivamente.
4. Dirigida a un rol cuya función sea supervisar, no despachar rápido.

**R4. Configurar ≠ usar.** Reglas de clasificación y umbrales quedan fuera del alcance de
quien triaje a diario. Las partes interesadas de seguridad física rechazan explícitamente
dar acceso de configuración a usuarios regulares. **[Verificado, en el dominio exacto del
proyecto]**

## Decisiones con dirección, no con dato

**D1. La matriz impacto × urgencia se define aquí, no se hereda.** Existen al menos dos
implementaciones ITIL legítimas e incompatibles (IT Process Wiki: 3×3 → 5 prioridades;
TOPdesk: 5×3 → 7 prioridades). El spec debe definir sus propios niveles en términos del
dominio — impacto tipo "puerta única" vs. "perímetro completo", urgencia tipo "alarma activa
ahora" vs. "reporte histórico" — y documentarlo como decisión propia. **[Verificado que no
hay estándar único; el contenido concreto de la matriz es [Sin evidencia]]**

**D2. Clasificar automáticamente una fracción, no el 100%.** El único benchmark con
metodología transparente (Ericsson TRR: auto-asigna ~30% de los casos con 75% de precisión)
sugiere que delegar una minoría de casos con alta confianza es mejor patrón que clasificarlo
todo. La cifra es de otro dominio (bugs de software) — no la uses como objetivo.
**[Verificado como patrón, no como número aplicable]**

**D3. El criterio de éxito incluye confianza del operador, no solo velocidad.** El
experimento de Alibaba/Taobao midió –16,8% de duración y –0,412 puntos de satisfacción sin
ganancia de calidad. Automatizar puede empeorar la experiencia aunque los tiempos mejoren.
**[Verificado]**

**D4. Distingue escalada técnica de escalada con carga emocional.** En el mismo experimento,
escalar a un humano preserva la calidad cuando el motivo es técnico (+19,1% duración, sin
otros efectos) pero no cuando es emocional (+40,8% duración, +6 pp reintentos, –0,928 en
calificaciones). En este dominio, "persona disputando que se le negó el acceso" es el caso
emocional. **[Verificado en atención al cliente; el mapeo a seguridad física es
[Interpretación]]**

**D5. Mostrar el motivo de la sugerencia no es adorno.** La falta de explicación visible es
lo que la literatura de UX asocia con desconfianza y abandono. Y el sesgo de automatización
está medido: radiólogos muy experimentados cayeron de 82,3% a 45,5% de acierto cuando la IA
se equivocaba. Una sugerencia sin justificación arrastra a la persona al error.
**[Verificado, evidencia de dominio médico]**

## Lo que el equipo decide sin respaldo de la investigación

Estas preguntas quedaron sin fuente verificada. Decídelas por criterio de dominio y
**decláralo así en el spec** — no las atribuyas al deep research:

- **Modelo de datos del ticket.** Único dato de referencia: los 7 campos que sugiere
  Freshservice (Category, Sub-category, Item, Group/routing, Priority, Impact, Urgency).
  Qué necesita realmente una incidencia de acceso o alarma (ubicación, credencial implicada,
  tipo de dispositivo, hora del evento) es decisión propia.
- **Estados del ciclo de vida.** Sin fuente. Decide y documenta.
- **Métricas de evaluación del triaje.** Sin metodología estándar verificada. Con ~60
  tickets, revisión manual retrospectiva de todas las clasificaciones es más razonable que
  replicar una metodología de investigación. Propuesta: registrar la tasa de corrección del
  operador como proxy de precisión.
- **Qué hace "crítica" una alarma de acceso no autorizado, y quién lo decide hoy.** Vacío
  real de la investigación.
- **Umbrales de confianza numéricos, validación por schema, estrategias de fallback.** Sin
  fuente más allá del marco general del EDPS.
- **Sesgos de clasificación propios del dominio de seguridad física.** La única evidencia de
  sesgo verificada es médica y se usa solo por analogía.

## Lo que queda fuera de la primera versión

- Detección de tickets duplicados: con ~60 tickets el volumen no lo justifica, y ninguna
  fuente con métricas sobrevivió la verificación.
- Resumen automático de hilos largos: mismo caso.
- Cualquier comparativa de mercado de ITSM como benchmark de precisión: las disponibles no
  publican metodología y al menos una tiene conflicto de interés no revelado.
