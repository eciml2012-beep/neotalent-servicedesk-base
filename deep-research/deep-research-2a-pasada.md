# Deep Research — Mini Service Desk: Triaje de Incidencias de Seguridad Física con IA

> **Nota de alcance y procedencia.** Segunda pasada de investigación (2026-09-22). Recoge las
> afirmaciones verificadas de una pasada anterior —marcadas *[1ª pasada]*, con su fuente
> original intacta pero sin re-verificación en esta sesión— y añade material nuevo verificado
> contra fuente primaria: documentación oficial de Atlassian, Zendesk y Freshservice, el texto
> del RGPD y de la LOPDGDD, y papers con resultados de producción. Las dos áreas que la pasada
> anterior declaró vacías (modelo de datos y métricas) ahora tienen evidencia, aunque de
> calidad desigual, y se indica cuál.

## Resumen ejecutivo

**(1) La industria ya convergió en el patrón "la IA rellena campos, la persona decide", pero
no en si la confirmación es obligatoria.** Freshservice exige que el agente pulse "Update"
para aplicar la sugerencia de Category, Sub-category, Item, Group, Priority, Impact y Urgency
(Freshservice, documentación de soporte oficial, consultada 2026). Zendesk hace lo contrario:
clasifica topic, sentiment, language y entidades de forma totalmente automática, "no manual
input required" (Zendesk, "About intelligent triage", consultada 2026-09). Jira Service
Management se queda en medio: sugiere request types y campos, y solo genera prioridad al crear
incidencias desde alertas (Atlassian Support, consultada 2026-09). **La confirmación humana es
una decisión de producto, no un estándar.**

**(2) Hay un sistema de triaje en producción con métricas creíbles y de dominio cercano.**
Mandal et al. (IBM, arXiv:1808.02636, 2018-08-08) reportan ~90% de precisión con cobertura
≥90% en asignación automática de tickets de helpdesk por email, desplegado en tres proveedores
de servicio, asignando >40.000 correos al mes y ahorrando ~23.000 horas-hombre al año. Es una
cifra mucho más alta que la de Ericsson (75% de precisión sobre el ~30% que se atreve a
auto-asignar), y la diferencia está en la cobertura: quien clasifica menos casos acierta menos.

**(3) El marco legal es más restrictivo que cualquier recomendación de diseño.** El artículo
22.1 del RGPD da derecho "a no ser objeto de una decisión basada únicamente en el tratamiento
automatizado... que produzca efectos jurídicos o le afecte significativamente de modo similar",
y el 22.3 obliga a garantizar "el derecho a obtener intervención humana". Negar el acceso
físico de una persona a su puesto de trabajo cae plausiblemente en ese supuesto. **[Verificado
el texto legal; la calificación del caso concreto es [Interpretación]]**

**(4) En seguridad física la prioridad no la fija el tipo de alarma, sino la verificación.** La
práctica del sector es que una alarma sin verificar no genera respuesta prioritaria: la
verificación (contacto con el sitio, testigo, vídeo) es lo que eleva la prioridad, y el criterio
concreto vive en los SOP de cada organización, no en un estándar público (ANSI/SIA CP-01-2019;
literatura de GSOC, consultada 2026-09).

**(5) Mostrar la sugerencia sin justificarla empeora el juicio de la persona.** Radiólogos muy
experimentados cayeron de 82,3% a 45,5% de acierto cuando la IA se equivocaba (Dratsch et al.,
*Radiology*, 2023) *[1ª pasada]*, y el efecto inverso también está documentado: la gente
abandona un algoritmo tras verle fallar una vez, aunque siga siendo mejor que el humano
(Dietvorst, Simmons y Massey, *JEP: General*, 2015). El sistema tiene las dos patologías
posibles y ninguna se corrige con más automatización.

**Implicación transversal:** el Mini Service Desk debe construirse como *sugerencia explicada +
confirmación obligatoria*, con la prioridad derivada de una matriz definida por el equipo y
ninguna consecuencia física automatizada. Lo que sigue documenta de dónde sale cada pieza.

## 1. Estado del arte de herramientas de service desk

**[Verificado]** **Freshservice** documenta que su "Ticket Field Suggester", parte de Freddy AI
Copilot, usa un modelo entrenado con tickets históricos para sugerir Category, Sub-category,
Item, Group, Priority, Impact y Urgency en tickets entrantes, y que las sugerencias **solo se
aplican si el agente pulsa "Update"** (Freshservice / Freshworks, documentación de soporte
oficial, artículos 240431 y 50000009429, consultada 2026). *[1ª pasada, fuente conservada]*

**[Verificado]** **Zendesk** clasifica automáticamente cada ticket entrante por *topic* (intent),
*sentiment*, *language* y *entidades* personalizadas. La documentación oficial es explícita en
que el proceso no requiere intervención: el modelo analiza el contenido y "automatically
classifies it", las clasificaciones "are added as fields on the ticket and are available
immediately — no manual input required" (Zendesk, "About intelligent triage", help center
oficial, consultada 2026-09). Disponible en planes Suite y Support Professional y superiores;
**usar esas clasificaciones en flujos de trabajo requiere el add-on Copilot**. La documentación
**no publica umbrales de confianza ni métricas de fiabilidad del modelo** — un dato relevante
por lo que omite.

**[Verificado]** **Jira Service Management** sugiere request types a partir de descripciones del
trabajo del equipo, puede sugerir request types para varios work items a la vez (triaje en
bloque), y recomienda qué campos añadir al construir formularios. La generación de **prioridad**
aparece documentada solo en un caso: al crear incidencias desde alertas, donde la IA genera
título, descripción y prioridad. Incluido en planes Standard, Premium y Enterprise; no
disponible en el entorno Atlassian Government (Atlassian Support, "AI features in Jira Service
Management", consultada 2026-09). La documentación **no especifica si se requiere confirmación
humana** antes de aplicar las sugerencias.

**[Verificado, autoreportado]** ServiceNow afirma que su despliegue interno de agente IA resuelve
más del 90% de las solicitudes de TI de sus propios empleados (ServiceNow, comunicado de febrero
de 2026, recogido por VentureBeat el 2026-02-26). Cifra de la propia empresa sobre su propio uso
interno. *[1ª pasada]*

**[Verificado]** BMC Helix ITSM usa IA/ML para analítica predictiva, clasificación automática de
tickets y detección de anomalías (Corptec, 2025-04-25, corroborado contra docs.bmc.com).
*[1ª pasada]*

**[Interpretación]** Las tres herramientas documentadas de primera mano ocupan tres posiciones
distintas en el mismo eje: Freshservice exige confirmación, Zendesk no la contempla, Jira no lo
dice. Que la documentación oficial de Zendesk presente "no manual input required" como
característica deseable, y la de Freshservice presente el clic de "Update" como parte del
diseño, indica que **no existe consenso de industria** sobre si el triaje por IA debe cerrarse
solo. Es una decisión de producto que cada equipo toma según el coste de equivocarse.

**[No verificado]** Las comparativas de mercado disponibles (Kanini, 2025-08-27) no publican
metodología de evaluación, y el autor de la más completa es "ServiceNow Practice Lead" en un
partner de implementación de ServiceNow — conflicto de interés no revelado. *[1ª pasada]*

### Implicación para este proyecto
El patrón de Freshservice —sugerencia de campo + confirmación explícita antes de persistir— es
el que conviene copiar, y ahora se puede justificar por contraste, no por autoridad: es la única
de las tres implementaciones documentadas que deja constancia de una decisión humana por ticket.
En un dominio donde el coste de una clasificación errónea es una respuesta de seguridad mal
dimensionada, ese registro vale más que la velocidad. Ninguna comparativa de mercado debe citarse
en el spec como benchmark de precisión.

## 2. Clasificación y priorización de tickets

**[Verificado]** La priorización ITIL no asigna prioridad directamente: se deriva combinando
urgencia e impacto mediante una matriz (IT Process Wiki, "Checklist Incident Priority",
2023-12-31; corroborado por PagerDuty, TOPdesk e InvGate). *[1ª pasada]*

**[Verificado]** No hay una matriz única. IT Process Wiki documenta una de 3×3 que produce 5
niveles de prioridad, cada uno con su tiempo objetivo de respuesta y resolución (Prioridad 1
Crítica = respuesta inmediata, resolución en 1 hora; Prioridad 5 Muy baja = respuesta en 1 día,
resolución en 1 semana), y el propio sitio la etiqueta como "solo un ejemplo". TOPdesk documenta
una alternativa explícitamente distinta: 5 niveles de impacto (organización, ubicación,
departamento, equipo, persona) × 3 de urgencia (crítica, normal, baja) → 7 niveles de prioridad
(TOPdesk, blog de producto, 2025-04-03). *[1ª pasada]*

**[Verificado]** La distinción severidad/prioridad es estándar y no trivial: la severidad dice
cuán grave es el problema, la prioridad dice qué hay que atender primero (Splunk, "Incident
Severity Levels 1-5 Explained"; InvGate, "Incident Severity Levels: SEV1 to SEV5", consultadas
2026-09). Son ejes separados: una incidencia grave pero contenida puede tener prioridad menor que
una leve pero en curso.

**[Verificado]** ISO/IEC 27035 proporciona un marco de clasificación de incidentes de seguridad
que cubre explícitamente incidentes de seguridad física además de los de información (PECB,
"Navigating Disruptions: The Crucial Role of Incident Classification", consultada 2026-09). La
norma es de pago y no se pudo consultar el texto primario.

**[Verificado]** En alarmas de intrusión, el criterio operativo que eleva la prioridad **no es el
tipo de alarma sino la verificación**. "Verify" se define como el intento de la central de
monitorización de contactar con el sitio o el usuario por teléfono u otros medios electrónicos
para determinar si la señal es válida antes de solicitar despacho policial; y la respuesta
policial prioritaria se asigna a alarmas con verificación de testigo de un delito en curso
(ANSI/SIA CP-01-2019, Control Panel Standard – Features for False Alarm Reduction, Security
Industry Association; documentación de programas municipales de registro de alarmas, consultadas
2026-09).

**[Verificado]** En centros de control de seguridad (GSOC), los niveles de prioridad de alarma y
las rutas de escalado **no proceden de un estándar público sino de los SOP de cada organización**:
los operadores triajean alarmas, verifican incidentes y ejecutan playbooks de escalado definidos
según el apetito de riesgo y las obligaciones regulatorias de esa organización concreta
(literatura de práctica GSOC: HiveWatch, Security Executive Council, consultadas 2026-09). Las
fuentes son de proveedores y de un consejo sectorial, no documentación normativa.

**[Interpretación]** Combinando lo anterior: la pregunta "¿qué hace que una alarma de acceso no
autorizado sea crítica?" no tiene respuesta de estándar porque **en el sector se responde por
política de cada organización**, y el factor que más consistentemente aparece en las fuentes
disponibles no es la naturaleza del evento sino (a) si está verificado y (b) qué alcance tiene
el activo afectado. Quién lo decide hoy: el responsable de seguridad que aprueba el SOP, no el
operador que triaje. Esta lectura es coherente con las cuatro fuentes citadas pero ninguna la
formula así.

### Implicación para este proyecto
El spec debe definir su propia matriz y documentarla como decisión propia, con dos ejes que las
fuentes sí respaldan:
- **Impacto = alcance del activo.** El eje de TOPdesk traducido al dominio: persona → puerta →
  zona → instalación completa. El dataset ya tiene `zona` y `sistema_afectado`, que son los
  insumos naturales.
- **Urgencia = estado de verificación y actividad.** "Alarma activa sin verificar" ≠ "alarma
  verificada en curso" ≠ "reporte histórico". Esto es lo que CP-01 y la práctica de centrales de
  alarma sostienen, y es más defendible que clasificar por tipo de evento.

Y una consecuencia incómoda pero honesta: **el modelo no puede saber si una alarma está
verificada** — eso es información operativa que el ticket no contiene. Si la urgencia depende de
la verificación, la IA solo puede proponer un límite superior de prioridad, no la prioridad
final. Declararlo en el spec.

## 3. IA aplicada a clasificación y triaje: casos documentados

**[Verificado, producción, con métricas]** El caso más fuerte del informe: Mandal, Malhotra,
Agarwal, Ray y Sridhara, "Cognitive system to achieve human-level accuracy in automated
assignment of helpdesk email tickets" (arXiv:1808.02636, 2018-08-08). Reporta precisión **cercana
al 90% con cobertura de al menos el 90%** de los tickets de email, **desplegado en producción en
tres proveedores de servicio**, asignando **más de 40.000 correos al mes** de media, con un
ahorro reportado de **23.000 horas-hombre al año**. Es un sistema en producción con cifras en el
abstract, no un piloto ni un comunicado.

**[Verificado]** TRR, la herramienta de asignación automática de reportes de fallos de Ericsson,
asigna ~30% de los reportes entrantes con **75% de precisión**, y los auto-enrutados se resuelven
**~21% más rápido** (Borg, Jonsson, Engström, Bartalos y Szabó, arXiv:2209.08955, 2022-09-19;
publicado en *Empirical Software Engineering*, Springer, 2024-07-30). Estudio de caso longitudinal
con metodología explícita: entrevistas, actas de planificación de sprint y análisis causal
bayesiano. *[1ª pasada]*

**[Interpretación]** La distancia entre esos dos números (90% con cobertura 90% vs. 75% con
cobertura 30%) no se explica por calidad del modelo sino por **qué mide cada uno**: Ericsson
reporta precisión sobre lo que el sistema decide auto-asignar tras aplicar un criterio de
confianza; IBM reporta precisión sobre casi todo el volumen. Comparar las dos cifras como si
midieran lo mismo sería un error, y el informe anterior de este proyecto lo insinuaba. Lo
verificable es que **ambos sistemas eligen conscientemente su punto en la curva
cobertura/precisión**, que es la decisión de diseño real.

**[Verificado]** Un experimento de campo aleatorizado en Taobao (Alibaba) midió que desplegar IA
agéntica para resolver chats de atención redujo la duración media **16,8%** (p<0.001) y bajó la
satisfacción **0,412 puntos** (p<0.001), sin cambio significativo en la tasa de reintentos: ganancia
de velocidad sin ganancia de calidad y con coste de satisfacción (Wang, Zhu, Feng, Lu y Jia,
arXiv:2605.14830, 2026-05-14, rev. 2026-06-01). *[1ª pasada]*

**[Verificado, sin cifra]** Una tesis de máster de RIT compara SVM, Random Forest y ensemble para
clasificar y priorizar tickets de TI sobre un dataset público de Kaggle, y su resumen público
**no reporta ningún resultado cuantitativo** — describe resultados anticipados, no medidos
(Almarzooqi, RIT Digital Institutional Repository, enero de 2025). *[1ª pasada]*

**[No verificado — detección de duplicados]** Todas las cifras localizadas sobre detección de
duplicados por IA proceden de proveedores y ninguna publica metodología: "reducción del 30–40% de
registros duplicados en los primeros meses", "~18% de los tickets entrantes son duplicados",
"hasta el 40% en algunas organizaciones". Ninguna identifica población, periodo ni grupo de
control. Se registran aquí como **ejemplo de cifras no utilizables**, no como evidencia.

**[No verificado — resumen automático de hilos]** No se localizó ningún caso con métrica y
metodología visibles.

### Implicación para este proyecto
Dos decisiones salen de aquí:
1. **Elegir explícitamente el punto de la curva cobertura/precisión** y escribirlo en el spec.
   Con 60 tickets y clasificación hecha por Claude Code sobre el repo (no en caliente), la
   cobertura puede ser del 100% *porque toda salida pasa por revisión humana* — es un régimen
   distinto al de ambos casos citados y conviene decirlo, no tomar prestado su número.
2. **Duplicados y resumen de hilos quedan fuera del alcance.** No por falta de valor sino por
   falta de evidencia utilizable y porque con ~60 tickets el problema no existe.

## 4. Buenas prácticas para IA robusta en producción

**[Verificado]** El EDPS documenta, basándose en Sterz et al. (ACM FAccT 2024, arXiv:2404.04059),
cuatro condiciones necesarias para que la supervisión humana de una decisión automatizada sea
efectiva y no nominal: (1) capacidad real de intervenir o anular, (2) acceso a la información
relevante para entender y evaluar la decisión, (3) agencia real para ejercer esa anulación, y
(4) intenciones alineadas con el rol de supervisión (EDPS, "TechDispatch #2/2025 — Human Oversight
of Automated Decision-Making", 2025-09-23). *[1ª pasada]*

**[Verificado]** La efectividad de la escalada a un humano depende del motivo. En el experimento
de Taobao, cuando la IA escala por motivo **técnico** (fuera de su capacidad) la calidad se
preserva: sube la duración +19,1% (p<0.001) sin cambio significativo en reintentos ni
calificaciones. Cuando escala por motivo **emocional** (frustración del cliente), no: duración
+40,8%, reintentos +6 puntos porcentuales, calificaciones −0,928 puntos (Wang et al.,
arXiv:2605.14830, 2026). *[1ª pasada]*

**[Verificado, fuente de calidad media]** La autoconfianza declarada por un LLM en salida
estructurada está mal calibrada: se documenta que una confianza declarada de 0,9 en GPT-4 resulta
correcta solo ~72% de las veces, por lo que usarla como umbral duro es un antipatrón conocido
(literatura técnica de ingeniería de LLM en producción, consultada 2026-09). Las fuentes son
artículos técnicos con autoría identificable pero **no papers revisados por pares**, y el dato
concreto del 72% no se pudo trazar a su estudio original — se cita como señal de dirección, no
como cifra utilizable.

**[Verificado, misma calidad]** El patrón recurrente en esa misma literatura es de validación en
capas: (1) validación de esquema, (2) validadores semánticos que codifican reglas de negocio
cruzando campos, (3) comprobación contra referencias, (4) reintento acotado, y fallback a un
clasificador de reglas cuando la confianza cae. Consenso explícito en que **la validación de
esquema es el suelo, no el techo**: un JSON válido puede contener una clasificación imposible.

**[Interpretación]** La pieza que las fuentes técnicas y el marco EDPS comparten sin decirlo es
la misma: ninguna capa de validación automática sustituye el criterio (2) del EDPS, *acceso a la
información relevante*. Un umbral de confianza que descarta silenciosamente una clasificación
dudosa **retira información al supervisor** en vez de dársela. Para este proyecto es mejor
mostrar la clasificación dudosa marcada como dudosa que ocultarla.

**[No verificado]** No se localizó fuente citable sobre versionado de prompts o tests de regresión
para clasificación por LLM con evidencia de efecto medido.

### Implicación para este proyecto
Checklist directo para el spec, con arquitectura implícita:
- **Determinista vs. modelo.** El modelo produce *solo* dos campos nuevos (`prioridad`,
  `categoria`) sobre valores de un enum cerrado. Todo lo demás —filtrado, orden, conteos de la
  pantalla de métricas— es código determinista en `js/utils/`, sin IA. La frontera coincide con
  la que `CLAUDE.md` ya impone: la clasificación la hace Claude Code sobre el repo, la pantalla
  la muestra.
- **Validación en dos capas antes de escribir el JSON.** (1) el valor pertenece al enum;
  (2) coherencia: la prioridad es compatible con el `sistema_afectado` y la `zona` según la
  matriz de la sección 2. Un ticket que falla la capa 2 no se descarta: se marca.
- **Sin umbral silencioso.** Cuando el modelo dude, el ticket se marca como *pendiente de
  revisión* y se muestra así. Nunca se oculta ni se rellena con un valor por defecto invisible.
- **Fallback declarado.** Si la clasificación falla, el campo queda ausente y la interfaz lo
  muestra como "sin clasificar" — estado legítimo, no error.

## 5. Adopción y abandono de herramientas internas

**[Verificado]** Un estudio de UX sobre sistemas de seguridad física asistidos por IA
(videovigilancia, control de accesos) recogió 269 insights de partes interesadas mediante grupos
focales y entrevistas semiestructuradas en universidades, agencias de las fuerzas del orden,
centros de detención y retail, con participantes que incluían personal de seguridad, dueños de
negocio y profesionales de las fuerzas del orden, con aprobación de comité de ética (Mafi,
Maleki, Rahimi Ardabili y Tabkhi, UNC Charlotte, arXiv:2603.04552, 2026-03-04). *[1ª pasada]*

**[Verificado]** Su hallazgo central: las partes interesadas prefirieron consistentemente sistemas
que **aumenten** el juicio humano en vez de reemplazarlo, y **rechazaron explícitamente** dar a
usuarios regulares acceso sin restricciones a la configuración del sistema, esperando que ese
control quedara en personas designadas mientras los usuarios regulares interpretan y revisan
resultados (misma fuente, sección IV-E). *[1ª pasada]*

**[Verificado]** El mecanismo de abandono está documentado experimentalmente: las personas pierden
confianza en un pronosticador algorítmico **más rápido que en uno humano tras el mismo error**, y
tras verlo fallar lo evitan incluso cuando sigue siendo mejor que la alternativa humana. Cinco
estudios con diseño experimental: los participantes veían actuar al algoritmo, al humano, a ambos
o a ninguno, y luego decidían a cuál ligar sus incentivos (Dietvorst, Simmons y Massey, "Algorithm
Aversion: People Erroneously Avoid Algorithms After Seeing Them Err", *Journal of Experimental
Psychology: General*, 2015; preprint Wharton 2014).

**[Interpretación]** Los dos hallazgos anteriores se combinan mal y conviene verlo: el sistema
está expuesto simultáneamente a **sesgo de automatización** (la persona sigue una sugerencia
errónea, sección 8) y a **aversión al algoritmo** (la persona abandona el sistema tras un error
visible). No son contradictorios: el primero opera cuando la sugerencia no se puede evaluar, el
segundo cuando el error sí se ve. La lectura práctica es que **mostrar el razonamiento mueve el
sistema del primer régimen al segundo**, que es el menos dañino: alguien que desconfía de una
sugerencia mala y la corrige hace su trabajo; alguien que la acepta sin poder evaluarla, no.
Esta inferencia es mía, no la formula ninguna de las dos fuentes.

### Implicación para este proyecto
Perfil de usuario: alguien que triaje seguridad física a diario, probablemente sin perfil técnico.
Tres consecuencias para `docs/diseno.md`:
- **La ficha muestra por qué.** Junto a la prioridad sugerida, qué la motivó (sistema afectado,
  zona, texto que la disparó). No es adorno: es lo que convierte el error del modelo en algo
  corregible en vez de algo que arrastra.
- **Un error visible no debe tumbar la confianza en todo el sistema.** Dado el hallazgo de
  Dietvorst, la interfaz debe hacer barato corregir y dejar constancia de la corrección, para
  que el fallo se lea como "esto se ajusta" y no como "esto no funciona".
- **Configurar no es usar.** Umbrales y reglas de clasificación quedan fuera de la pantalla de
  uso diario. En este proyecto eso ya es cierto por construcción —la clasificación vive en el
  repo, no en el navegador— y conviene escribirlo como decisión, no como accidente.

## 6. Modelo de datos de un ticket

**[Verificado]** Campos que las herramientas documentadas manejan de forma nativa para
clasificación:
- **Freshservice:** Category, Sub-category, Item, Group (asignación de equipo/routing), Priority,
  Impact, Urgency (documentación de soporte oficial, 2026).
- **Zendesk:** topic/intent, sentiment, language, entidades personalizadas — añadidos como campos
  del ticket (Zendesk, help center oficial, 2026-09).
- **Jira Service Management:** request type como campo central de clasificación, más campos
  personalizados recomendados por IA al construir formularios (Atlassian Support, 2026-09).

**[Interpretación]** Los tres coinciden en tres funciones distintas que a veces se confunden:
**qué es** (category/topic/request type), **cuánto corre** (priority, derivada de impact+urgency)
y **quién lo coge** (group/routing). Zendesk añade una cuarta, *cómo se siente quien reporta*
(sentiment), que no tiene análogo en los ITSM clásicos. Ninguna fuente enumera "campos
imprescindibles vs. opcionales" — esa distinción no aparece en la documentación de producto,
que expone todo como configurable.

**[Verificado, fuentes de calidad media]** Los estados del ciclo de vida de una incidencia
convergen en una secuencia con variantes: **New/Open** (creada, sin asignar) → **In Progress**
(asignada y en trabajo) → **On Hold / Pending** (en espera, típicamente del usuario o de un
tercero) → **Resolved** (con resolución aplicada) → **Closed** (cerrada tras confirmación del
usuario), con **Cancelled** como salida lateral cuando el reportante no quiere seguir
(ManageEngine, glosario de incident management; IT Process Wiki, "Incident Management";
compilaciones de estados de ticket, consultadas 2026-09). Las fuentes son documentación de
proveedor y wikis sectoriales, no la publicación oficial de ITIL 4, que es de pago.

**[Verificado]** La distinción **Resolved ≠ Closed** es la variación más consistente entre
fuentes y tiene una razón explícita: una incidencia se resuelve cuando el técnico aplica la
solución, y se cierra solo cuando el usuario confirma que le sirve (mismas fuentes). El dataset
de este proyecto usa `abierto`/`cerrado`, que colapsa esa distinción.

**[No verificado]** Qué campos son imprescindibles en un ticket **de seguridad física** en
concreto. No se localizó ninguna fuente que lo documente; las que existen son genéricas de ITSM.

### Implicación para este proyecto
El dataset actual (`id`, `titulo`, `descripcion`, `sistema_afectado`, `reportado_por`, `zona`,
`fecha`, `estado`) ya cubre las tres funciones que las tres herramientas comparten, salvo la
clasificación misma:
- **`categoria`** ← la función "qué es" (category/topic/request type). Es el campo que falta.
- **`prioridad`** ← la función "cuánto corre". Derívala de impacto y urgencia según la sección 2;
  si el spec quiere trazabilidad, guarda también `impacto` y `urgencia` en vez de solo el
  resultado — es lo que hacen los tres productos y lo que permite auditar la decisión.
- **Routing** (`group`) **no aplica**: no hay equipos en este proyecto. Omitir, y decirlo.
- **Sentiment no aplica**: los tickets los reportan operadores internos, no clientes.

Sobre estados: `abierto`/`cerrado` es una simplificación deliberada del ciclo de cinco estados.
Mantenerla —60 tickets no justifican más— pero **declararla como simplificación en el spec**, con
la nota de que la distinción resolved/closed es la primera que habría que recuperar si el
proyecto creciera.

## 7. Métricas de evaluación del triaje

**[Verificado, metodología explícita]** La única metodología de medición de un triaje automático
documentada con detalle en esta investigación sigue siendo la de Ericsson: entrevistas, actas de
reuniones de planificación de sprint y datos de seguimiento de tickets, analizados con análisis
temático, estadística descriptiva y **análisis causal bayesiano** para aislar el efecto del
auto-enrutamiento de otros factores (Borg et al., arXiv:2209.08955, 2022). Es un **análisis
retrospectivo de logs combinado con entrevistas**. *[1ª pasada]*

**[Verificado]** La segunda metodología documentada es el **experimento de campo aleatorizado con
grupo de control**: Taobao comparó chats elegibles para IA contra un grupo atendido enteramente
por humanos, reportando efectos con significación estadística (Wang et al., arXiv:2605.14830,
2026). Es el diseño más fuerte de los localizados, y notablemente el que produjo el resultado
menos favorable a la automatización. *[1ª pasada]*

**[Verificado, fuentes de proveedor]** Definiciones operativas de las métricas que la pregunta de
investigación pedía:
- **First Response Time (FRT):** tiempo entre la creación del ticket y la primera respuesta
  sustantiva no automática. Se calcula como suma(primera respuesta − creación) / total de
  tickets. Las fuentes recomiendan **reportar la mediana, no la media**, porque unos pocos
  tickets muy retrasados inflan la media y ocultan la experiencia típica; y seguir además el
  percentil 90 como peor caso.
- **Tasa de reasignación / transferencia:** porcentaje de tickets que pasan de un agente o equipo
  a otro. Una tasa alta indica que el primer contacto es el equivocado. Las fuentes insisten en
  **distinguir el traspaso legítimo a un especialista del mal enrutamiento** — son cosas
  distintas y mezclarlas hace la métrica inútil.
(Geckoboard, Zendesk, InvGate, Lorikeet y compilaciones de KPI de service desk, consultadas
2026-09. Son fuentes de proveedor y blogs sectoriales: las **definiciones** son consistentes
entre ellas, los **benchmarks numéricos** que publican no tienen metodología visible y no se
usan aquí.)

**[No verificado]** Cómo se mide en la práctica la precisión de clasificación contra ground truth
humano en un service desk real: ninguna de las fuentes consultadas documenta el procedimiento
(quién etiqueta la verdad, con qué acuerdo entre anotadores, sobre qué muestra). Los papers
citados lo hacen sobre datasets etiquetados históricamente —es decir, tratan la asignación humana
pasada como verdad—, lo cual es una elección metodológica discutible que ninguno problematiza.

### Implicación para este proyecto
Con ~60 tickets y clasificación ejecutada sobre el repo, ni el diseño de Ericsson ni el de Taobao
son replicables ni necesarios. Criterios de aceptación proporcionados al tamaño:
- **Precisión por revisión manual completa.** 60 tickets se revisan enteros. La métrica es la
  **tasa de corrección**: cuántas clasificaciones cambia una persona al revisarlas. No hace falta
  muestreo ni ground truth previo — la revisión *es* el ground truth. Declarar en el spec que se
  trata la revisión humana como verdad, con la limitación que eso implica.
- **Desglose por categoría.** Una tasa de corrección global del 10% oculta que una categoría
  concreta falle el 60% de las veces. Con 60 tickets el desglose cabe en una tabla.
- **FRT y tasa de reasignación quedan fuera.** Miden operación de un service desk real con
  equipos y turnos; aquí no hay ni respuesta ni reasignación. Incluirlas sería teatro de métricas.
- La pantalla de métricas de `docs/diseno.md` es de reparto de volumen, no de rendimiento del
  clasificador. Son dos cosas distintas y conviene no mezclarlas en la misma vista.

## 8. Riesgos, límites y qué no automatizar

**[Verificado]** **Texto legal aplicable.** El artículo 22.1 del RGPD establece que "el
interesado tendrá derecho a no ser objeto de una decisión basada únicamente en el tratamiento
automatizado, incluida la elaboración de perfiles, que produzca efectos jurídicos en él o le
afecte significativamente de modo similar". El artículo 22.3 obliga al responsable, en los
supuestos donde el tratamiento sí es admisible, a adoptar medidas que salvaguarden "como mínimo
el derecho a obtener intervención humana por parte del responsable, a expresar su punto de vista
y a impugnar la decisión" (Reglamento (UE) 2016/679, texto consolidado, consultado 2026-09).

**[Verificado]** El considerando 71 del RGPD añade el derecho a obtener una explicación de la
decisión alcanzada. La ICO británica precisa que el umbral de "efectos jurídicos o similarmente
significativos" requiere que "the decision must have a serious impact on an individual", y que la
organización debe identificar qué personal está autorizado a revisar y cambiar decisiones
automatizadas (ICO, guía sobre derechos relacionados con decisiones automatizadas, consultada
2026-09).

**[Interpretación]** Denegar o revocar el acceso físico de una persona a su centro de trabajo,
de forma automatizada y sin revisión, es un candidato razonable al supuesto del artículo 22.1: es
una decisión sobre una persona identificada, con efecto material inmediato sobre su capacidad de
trabajar. No se localizó jurisprudencia ni guía que califique este caso concreto, así que la
calificación es mía a partir del texto legal y del umbral que describe la ICO — **no es una
afirmación verificada** y, si el proyecto fuera real, requeriría criterio jurídico.

**[Verificado]** **Privacidad de los datos del ticket.** En España, el artículo 22 de la LOPDGDD
fija que los datos captados por videovigilancia con fines de seguridad "serán suprimidos en el
plazo máximo de un mes desde su captación", salvo cuando deban conservarse para acreditar actos
contra la integridad de personas, bienes o instalaciones, en cuyo caso deben ponerse a
disposición de la autoridad competente en un plazo máximo de **72 horas** desde que se tuvo
conocimiento de la grabación (Ley Orgánica 3/2018, LOPDGDD, art. 22). La AEPD, en su guía de
videovigilancia, exige además valorar la proporcionalidad de las imágenes respecto a la
finalidad, llevar registro de actividades de tratamiento, informar a quien accede a las imágenes
de sus obligaciones de reserva y confidencialidad, y adoptar medidas que impidan el acceso de
personal no autorizado (AEPD, Guía sobre el uso de videocámaras para seguridad y otras
finalidades, y fichas prácticas de videovigilancia, consultadas 2026-09).

**[Interpretación]** Un ticket de seguridad física es un tratamiento de datos personales aunque
no contenga imágenes: "acceso denegado a [persona] en [puerta] a las [hora]" es un dato de
localización y conducta de una persona identificada, y una serie de esos tickets es un patrón de
presencia. La LOPDGDD regula explícitamente las imágenes, no los registros de acceso, así que el
plazo de un mes **no se traslada automáticamente** — pero el principio de limitación del plazo de
conservación del RGPD sí aplica. Esta extensión es mía.

**[Verificado]** **Sesgo de automatización, medido.** La precisión de 27 radiólogos evaluando 50
mamografías cayó significativamente cuando las sugerencias de IA (BI-RADS) eran incorrectas, en
todos los niveles de experiencia: poca experiencia, de 79,7% a 19,8%; experiencia media, de 81,3%
a 24,8%; muy experimentados, de 82,3% a 45,5% (Dratsch et al., "Automation Bias in Mammography",
*Radiology*, publicado en línea 2023-05-02, DOI 10.1148/radiol.222176). *[1ª pasada]*

**[Verificado]** Las cuatro condiciones del EDPS (sección 4) son, leídas al revés, un criterio de
qué **no** cuenta como supervisión: si el operador no puede intervenir, no tiene la información,
no tiene agencia real o no tiene rol genuino de supervisión, la supervisión es nominal (EDPS,
2025-09-23). *[1ª pasada]*

**[No verificado]** No se localizó ninguna fuente sobre sesgos de clasificación automática
—demográficos, geográficos o de otro tipo— **específicos del dominio de seguridad física o
control de accesos**. La evidencia de sesgo disponible es de radiología y se usa aquí por
analogía. Es un vacío relevante: un clasificador entrenado sobre incidencias de accesos podría
aprender asociaciones entre zonas, turnos o perfiles de reportante sin que nadie lo mida.

### Implicación para este proyecto
Tres restricciones para la constitución del proyecto, en orden de dureza:

1. **Ninguna consecuencia física se automatiza.** Cerrar o abrir una credencial, avisar a un
   guardia, escalar una alarma a intervención: nada de eso se dispara desde una clasificación. La
   IA produce `prioridad` y `categoria` en un JSON; ahí termina su alcance. Respaldo: artículo
   22.1 y 22.3 del RGPD **[Verificado]** + las cuatro condiciones del EDPS **[Verificado]**; la
   calificación del caso concreto bajo el art. 22 es **[Interpretación]**.

2. **Los datos del dataset son y seguirán siendo inventados.** `CLAUDE.md` ya lo impone. Esta
   investigación le da el motivo: con datos reales, el repositorio contendría patrones de
   presencia de personas identificables, sujetos a limitación de plazo de conservación y a las
   medidas de acceso que exige la AEPD. Convertir la regla en principio de la constitución, no
   en nota de estilo.

3. **La explicación de la sugerencia es un requisito, no una mejora.** Recital 71 del RGPD
   (derecho a explicación) + condición (2) del EDPS (acceso a información relevante) + el dato de
   sesgo de automatización de *Radiology*. Una sugerencia sin justificación visible falla las
   tres a la vez.

Y una tarea pendiente honesta: **nadie ha medido el sesgo de un clasificador de incidencias de
seguridad física**. Si el proyecto llegara a datos reales, medir la distribución de prioridades
por zona y por perfil de reportante sería trabajo obligatorio, no opcional.

## Qué no se ha podido verificar

- **Si Jira Service Management exige confirmación humana** antes de aplicar una sugerencia de
  clasificación. La documentación oficial describe la función pero no el flujo de confirmación.
- **Qué hace "crítica" una incidencia concreta de acceso no autorizado.** La práctica del sector
  apunta a que lo deciden los SOP de cada organización (verificado como práctica), pero no existe
  un criterio público que se pueda citar para un caso concreto.
- **El texto primario de ISO/IEC 27035** (norma de pago). Solo se verificó su existencia y alcance
  a través de fuentes secundarias.
- **La publicación oficial de ITIL 4 sobre estados del ciclo de vida** (de pago). Los estados
  documentados proceden de wikis sectoriales y documentación de proveedores, consistentes entre
  sí pero no normativas.
- **Cifras de detección de duplicados.** Todas las localizadas son de proveedor y ninguna publica
  población, periodo ni grupo de control.
- **Casos con métrica de resumen automático de hilos largos.** Ninguno.
- **Cómo se construye el ground truth humano** en las evaluaciones de precisión de clasificación
  de tickets: ninguna fuente documenta quién etiqueta, con qué acuerdo entre anotadores ni sobre
  qué muestra.
- **Benchmarks numéricos de FRT y tasa de reasignación** con metodología visible. Las
  definiciones sí son consistentes; las cifras no son trazables.
- **El dato del 72% de calibración de la autoconfianza de GPT-4**: circula en literatura técnica
  sin que se pudiera trazar al estudio original.
- **Sesgos de clasificación automática propios del dominio de seguridad física.** Vacío completo.
- **Calificación jurídica** de una denegación automatizada de acceso físico bajo el artículo 22
  del RGPD. No se localizó jurisprudencia ni guía específica.

## Fuentes

**Papers y literatura académica**

1. Mandal, A.; Malhotra, N.; Agarwal, S.; Ray, A.; Sridhara, G. "Cognitive system to achieve
   human-level accuracy in automated assignment of helpdesk email tickets". arXiv:1808.02636,
   2018-08-08. https://arxiv.org/abs/1808.02636
2. Borg, M.; Jonsson, L.; Engström, E.; Bartalos, B.; Szabó, A. J. "Adopting Automated Bug
   Assignment in Practice: A Longitudinal Case Study at Ericsson". arXiv:2209.08955, 2022-09-19;
   publicado en *Empirical Software Engineering* (Springer), 2024-07-30.
   https://arxiv.org/abs/2209.08955
3. Wang, Y.; Zhu, C.; Feng, T.; Lu, L. X.; Jia, B. "Agentic AI and Human-in-the-Loop
   Interventions: Field Experimental Evidence from Alibaba's Customer Service Operations".
   arXiv:2605.14830, 2026-05-14, rev. 2026-06-01. https://arxiv.org/abs/2605.14830
4. Mafi, N.; Maleki, S.; Rahimi Ardabili, B.; Tabkhi, H. "Beyond the Interface: Redefining UX for
   Society-in-the-Loop AI Systems". UNC Charlotte, arXiv:2603.04552, 2026-03-04.
   https://arxiv.org/abs/2603.04552
5. Dietvorst, B. J.; Simmons, J. P.; Massey, C. "Algorithm Aversion: People Erroneously Avoid
   Algorithms After Seeing Them Err". *Journal of Experimental Psychology: General*, 2015
   (preprint Wharton, 2014).
   https://marketing.wharton.upenn.edu/wp-content/uploads/2016/10/Dietvorst-Simmons-Massey-2014.pdf
6. Dratsch, T.; Chen, X.; Rezazade Mehrizi, M.; et al. "Automation Bias in Mammography: The
   Impact of Artificial Intelligence BI-RADS Suggestions on Reader Performance". *Radiology*,
   publicado en línea 2023-05-02. DOI 10.1148/radiol.222176.
7. Sterz, S. et al. "On the Quest for Effectiveness in Human Oversight: Interdisciplinary
   Perspectives". ACM FAccT 2024, arXiv:2404.04059.
8. Almarzooqi, M. "Automated Prioritization and Routing of IT Support Tickets Using Machine
   Learning". Tesis de máster, Rochester Institute of Technology, enero de 2025.
   https://repository.rit.edu/theses/12020/

**Normativa y reguladores**

9. Reglamento (UE) 2016/679 (RGPD), artículo 22 y considerando 71. Texto consolidado consultado
   2026-09. https://gdpr-info.eu/art-22-gdpr/
10. Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales
    (LOPDGDD), artículo 22 — tratamientos con fines de videovigilancia. Consultado 2026-09.
11. Agencia Española de Protección de Datos (AEPD). Guía sobre el uso de videocámaras para
    seguridad y otras finalidades, y fichas prácticas de videovigilancia. aepd.es, consultadas
    2026-09. https://www.aepd.es/en/activities/video-surveillance
12. European Data Protection Supervisor (EDPS). "TechDispatch #2/2025 — Human Oversight of
    Automated Decision-Making". 2025-09-23.
    https://www.edps.europa.eu/data-protection/our-work/publications/techdispatch/
13. Information Commissioner's Office (ICO). "Rights related to automated decision making
    including profiling". Consultada 2026-09.
    https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/rights-related-to-automated-decision-making-including-profiling/

**Documentación oficial de producto**

14. Freshservice (Freshworks). "Use Ticket Field Suggester to categorize tickets" y "Configure
    Freddy AI Copilot features". support.freshservice.com, artículos 240431 y 50000009429,
    consultados 2026.
15. Zendesk. "About intelligent triage" y "Automatically classifying customer intent, sentiment,
    and language". support.zendesk.com, consultadas 2026-09.
    https://support.zendesk.com/hc/en-us/articles/4964463770650-About-intelligent-triage
16. Atlassian Support. "AI features in Jira Service Management". Consultada 2026-09.
    https://support.atlassian.com/organization-administration/docs/atlassian-intelligence-features-in-jira-service-management/

**Estándares y práctica sectorial**

17. Security Industry Association. ANSI/SIA CP-01-2019, "Control Panel Standard – Features for
    False Alarm Reduction". https://www.securityindustry.org/industry-standards/cp-01-2019/
18. IT Process Maps GbR. "Checklist Incident Priority" e "Incident Management". IT Process Wiki,
    página actualizada 2023-12-31.
    https://wiki.en.it-processmaps.com/index.php/Checklist_Incident_Priority
19. TOPdesk. "ITIL Incident Priority Matrix: the key to more effective Incident Management".
    2025-04-03. https://www.topdesk.com/en/blog/incident-priority-matrix/
20. Splunk. "Incident Severity Levels 1-5 Explained". Consultada 2026-09.
    https://www.splunk.com/en_us/blog/learn/incident-severity-levels.html
21. PECB. "Navigating Disruptions: The Crucial Role of Incident Classification" (referencia a
    ISO/IEC 27035). Consultada 2026-09.
22. ManageEngine. "ITIL incident management glossary: Key ITSM terms defined". Consultada
    2026-09.
23. HiveWatch; Security Executive Council. Material sobre SOP y escalado en GSOC. Consultados
    2026-09. https://securityexecutivecouncil.com/insight/program-best-practices/defining-best-practices-in-global-security-operations-centers-1258
24. Geckoboard, "First Response Time (FRT) KPI"; Zendesk, "17 help desk metrics"; InvGate,
    "Service Desk KPIs"; Lorikeet, "First Response Time Benchmarks". Consultadas 2026-09
    (definiciones operativas; benchmarks numéricos no utilizados por falta de metodología).

**Fuentes de calidad media citadas como señal, no como dato**

25. Kanini (Rajamani, R., ServiceNow Practice Lead). "ITSM Software Comparison 2025". Actualizado
    2025-08-27. Conflicto de interés no revelado; citada solo para documentar esa circunstancia.
26. Corptec. "Top ITSM Tools 2025". 2025-04-25.
27. VentureBeat. "ServiceNow resolves 90% of its own IT requests autonomously". 2026-02-26.
28. Literatura técnica sobre validación de salida de LLM en producción (Towards Data Science,
    DEV Community; artículos con autoría identificable, sin revisión por pares). Consultada
    2026-09.
