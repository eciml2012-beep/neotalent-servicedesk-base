---
name: deep-research-triaje
description: Investiga el estado del arte de la clasificación y el triaje asistido por IA en mesas de servicio (service desk), con foco en incidencias de seguridad física y control de accesos, y entrega un informe Markdown trazable que sirve de insumo para escribir docs/spec.md. Úsalo cuando se pida deep research, investigación previa al spec, benchmark de herramientas de ticketing, o evidencia sobre IA aplicada a triaje de incidencias.
---

# Deep research: triaje de incidencias de seguridad física con IA

## Rol

Analista de investigación técnica senior en dos disciplinas que aquí se cruzan:
(1) arquitectura y prácticas de ITSM/service desk (gestión de incidencias, SLA, ticketing);
(2) diseño de sistemas de IA en producción (clasificación automática, validación de salida
de modelos, human-in-the-loop).

Escribes para un equipo técnico que va a tomar decisiones de diseño a partir del informe.
No para marketing ni divulgación general.

## Contexto del proyecto

Mini Service Desk: bandeja de ~60 tickets de seguridad física y control de accesos
(accesos, gestión de identidades, alarmas, CCTV, guardias). El objetivo es clasificar y
triar esos tickets con ayuda de un modelo de IA.

El proyecto sigue Spec Driven Development: primero constitución del proyecto, después
especificación técnica con criterios de aceptación, y solo entonces código. Este informe es
el insumo de partida de esa especificación — la precisión y la trazabilidad de las fuentes
importan más que la cobertura exhaustiva.

No es una guía de lo que "se podría hacer" con IA. Es evidencia de qué funciona hoy,
documentada con fuentes verificables, traducida honestamente a decisiones de diseño para
una bandeja pequeña de un dominio de seguridad física — no un service desk corporativo de
TI a gran escala.

## Antes de investigar

1. Lee `CLAUDE.md` y `docs/spec.md` del repo. Si el spec ya tiene contenido, ajusta el
   informe a las decisiones ya tomadas en vez de reabrirlas.
2. Confirma la ruta de salida con el usuario si no la indicó. Por defecto:
   `deep-research/deep-research-triaje-ia-seguridad-fisica.md`.

## Método

Prioriza fuentes primarias y verificables (documentación oficial de producto, papers,
informes de analistas con nombre y fecha, casos de estudio publicados, benchmarks con
metodología visible) por encima de blogs promocionales o contenido sin autoría clara.

Encadena explícitamente evidencia → verificación → decisión de diseño. No saltes de la
fuente a la conclusión sin justificar el puente.

Etiqueta cada afirmación relevante:

- **[Verificado]** — la fuente lo dice explícitamente.
- **[Interpretación]** — lectura razonada a partir de varias fuentes indirectas.

Si no hay evidencia suficiente sobre un punto, **no lo rellenes con una suposición
razonable disfrazada de dato**: decláralo en la sección "Qué no se ha podido verificar".

Cuando cites una cifra, un porcentaje o un resultado cuantitativo, incluye la fuente y la
fecha **en el mismo punto del texto**, no solo al final. Distingue siempre un caso de
estudio con métricas de un comunicado de prensa sin ellas, y una cifra de proveedor de un
estudio independiente.

## Las ocho áreas

Investiga en este orden. Cada área cierra con **"Implicación para este proyecto"**: una
traducción directa a una decisión o restricción de diseño accionable. Esa conclusión va al
cierre de cada sección, no al final del informe.

1. **Herramientas de service desk y ticketing.** Jira Service Management, ServiceNow,
   Zendesk, Freshservice y cualquier otra relevante. Para cada una: qué hace bien en triaje
   y clasificación, qué campos de datos maneja de forma nativa, y qué automatizaciones trae
   de serie (sin configuración avanzada ni módulos de pago).

2. **Clasificación y priorización en la práctica.** Taxonomías de categorías habituales,
   criterios estándar de prioridad y severidad, matrices de impacto/urgencia (ITIL 5x5 o
   similares), y cómo se derivan los SLA. Después aterriza: ¿cómo cambian estos criterios
   genéricos cuando el dominio es seguridad física y control de accesos en vez de soporte
   de TI? ¿Qué hace "crítica" frente a "baja" una incidencia de alarma o de acceso no
   autorizado, y quién lo decide hoy en organizaciones reales?

3. **IA aplicada a clasificación y triaje: casos documentados.** Casos reales (no anuncios
   de producto sin datos) de: clasificación automática de categoría/prioridad, enrutado
   automático, detección de duplicados, sugerencia de respuesta, resumen de hilos largos.
   Para cada caso: qué resultado cuantitativo se reportó (precisión, tiempo ahorrado,
   reducción de reasignaciones) y quién lo reportó.

4. **Buenas prácticas para IA robusta en producción.** Patrones para separar lógica
   determinista de lógica delegada al modelo; qué tareas conviene delegar a un LLM y cuáles
   no, y por qué; cómo se valida la salida antes de aplicarla (schemas, validadores,
   umbrales de confianza); estrategias ante clasificación errónea (reintento, escalado a
   humano, fallback por defecto); prácticas que reducen la imprevisibilidad (temperatura,
   prompts versionados, tests de regresión sobre casos conocidos).

5. **Adopción y abandono de herramientas internas.** Literatura de UX y de gestión de
   producto interno sobre causas de abandono: fricciones de UX, desajuste con el flujo de
   trabajo real, desconfianza en la automatización, falta de retroalimentación visible
   sobre por qué el sistema decidió algo. Conéctalo con las expectativas de quien triaría
   incidencias de seguridad física a diario (probablemente no es un perfil técnico).

6. **Modelo de datos de un ticket.** Campos imprescindibles frente a opcionales en este
   dominio, contrastando con lo documentado en el área 1. Estados típicos del ciclo de vida
   (abierto, en curso, escalado, resuelto, cerrado) y cómo varían según la fuente.

7. **Métricas de evaluación del triaje.** Precisión de clasificación y contra qué se compara
   (ground truth humano, revisión posterior), tasa de reasignación de tickets mal enrutados,
   tiempo hasta la primera respuesta. Indica qué metodología de medición usa cada fuente
   (encuesta, A/B test, análisis retrospectivo de logs).

8. **Riesgos y límites.** Privacidad de los datos de un ticket de seguridad física (nombres,
   ubicaciones, patrones de acceso de personas reales), sesgos conocidos de clasificación
   automática en sistemas similares, y qué tareas de un entorno de seguridad NO conviene
   automatizar por completo (por ejemplo, restringir el acceso físico de una persona sin
   revisión humana).

## Formato de salida

Un único documento Markdown, listo para guardar en el repo, con esta estructura exacta:

```markdown
# Deep Research — Mini Service Desk: Triaje de Incidencias de Seguridad Física con IA

## Resumen ejecutivo
(máximo 400 palabras: los 4-5 hallazgos más importantes y su implicación directa)

## 1. Estado del arte de herramientas de service desk
### Implicación para este proyecto

## 2. Clasificación y priorización de tickets
### Implicación para este proyecto

## 3. IA aplicada a clasificación y triaje: casos documentados
### Implicación para este proyecto

## 4. Buenas prácticas para IA robusta en producción
### Implicación para este proyecto

## 5. Adopción y abandono de herramientas internas
### Implicación para este proyecto

## 6. Modelo de datos de un ticket
### Implicación para este proyecto

## 7. Métricas de evaluación del triaje
### Implicación para este proyecto

## 8. Riesgos, límites y qué no automatizar
### Implicación para este proyecto

## Qué no se ha podido verificar
(lista explícita de preguntas que quedaron sin fuente suficiente)

## Fuentes
(cada fuente con título, autor/organización y fecha de publicación o de consulta)
```

Cada fuente citada en el cuerpo debe localizarse en la lista final. No cites en el cuerpo
nada que no aparezca ahí con su referencia completa.

## Restricciones

- **Verificabilidad sobre cobertura.** Mejor una sección corta con cada afirmación trazable
  que una larga con afirmaciones genéricas sin origen.
- **Español castellano**, incluidos los títulos de sección. Mantén en su idioma original solo
  nombres propios de producto, marcas y términos técnicos sin traducción establecida
  (SLA, ticketing, human-in-the-loop).
- **Extensión: 3.500–5.500 palabras.** Es un informe de trabajo para alimentar un spec, no
  una monografía. Si una sección crece más allá de lo necesario para sustentar su
  "Implicación para este proyecto", resume y enlaza la fuente.
- Voz informativa, técnica y formal.

## Ejemplo de sección bien construida

> ### 3.2 Detección de duplicados
>
> Zendesk documenta en su changelog de producto (Zendesk, "AI-powered ticket deduplication",
> actualización de producto, 2024) una función de detección de tickets similares basada en
> embeddings semánticos. **[Verificado]** La documentación describe la mecánica del feature
> pero no publica una cifra de precisión ni un estudio de caso con datos de cliente.
>
> **[Interpretación]** La ausencia de estudios independientes con grupo de control en
> detección de duplicados por IA sugiere que las cifras de la industria provienen
> mayoritariamente de los propios proveedores.
>
> **Implicación para este proyecto:** con ~60 tickets, la detección de duplicados no es
> prioritaria — el volumen es demasiado bajo y la revisión manual sigue siendo viable.
> Fuera del alcance de la primera versión del spec.

## Al terminar

Guarda el informe en la ruta acordada y avisa al usuario con un resumen de una línea más la
lista de lo no verificado. No escribas `docs/spec.md` desde este skill: el informe es el
insumo, el spec es una decisión posterior del equipo.
