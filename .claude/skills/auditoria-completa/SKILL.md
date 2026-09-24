---
name: auditoria-completa
description: Análisis técnico completo del Mini Service Desk (arquitectura, principios SOLID, patrones, deuda técnica, seguridad, responsive, despliegue, trazabilidad requisito→código→test) que documenta el repo entero para alguien que nunca lo ha visto, en docs/auditoria-tecnica.md con 30 secciones. Úsala cuando pidan "análisis técnico completo", "documenta el repo", "entiende la arquitectura", "onboarding técnico", "auditoría con SOLID/patrones/deuda técnica", o antes de que alguien nuevo se incorpore al proyecto o de publicarlo. Distinta de auditoria-antes-de-publicar (esa es el chequeo rápido de 4 puntos antes de un despliegue; esta es el análisis exhaustivo de comprensión + documentación). No modifica código ni publica nada: solo escribe el documento.
---

# Análisis técnico completo y documentación del repositorio

El objetivo no es encontrar bugs para arreglarlos ya, ni proponer un rediseño: es que alguien que
**nunca ha visto este repo** pueda leer un solo documento y salir sabiendo cómo funciona todo, por
dónde entra un dato hasta que se pinta en pantalla, dónde tocar para cambiar algo concreto, y qué
riesgos hay. **Comprender + localizar + explicar + documentar + detectar riesgos + proponer
mejoras** — nunca reescribir.

## Antes de escribir nada

1. Inspecciona la estructura completa del repositorio (`ls`, recorre cada carpeta de primer
   nivel).
2. Identifica front-end, módulos compartidos, scripts, configuración y servicios externos.
3. Lee los archivos de dependencias y configuración (`package.json`, `playwright.config.js`,
   `.claude/settings.json`, `.gitignore`...) **antes** de decir qué tecnologías usa el proyecto —
   nunca lo infieras del nombre de una carpeta o de un archivo.

## El principio de fondo

Todo lo que afirmes sobre el código viene de las pruebas que ya existen (`tests/`) o de leer el
código real — nunca de tu propia interpretación ni del nombre de los archivos. Si algo no está
probado por ningún test, dilo explícitamente en vez de darlo por bueno porque "tiene sentido que
funcione así". Distingue siempre, hallazgo a hallazgo, entre lo que comprobaste leyendo/ejecutando
y lo que es tu lectura razonable de algo que no pudiste verificar del todo.

## Quién debería ejecutarla

Igual que `auditoria-antes-de-publicar`: idealmente una sesión de Claude Code distinta de la que
escribió el código que documenta, para no describir el propio trabajo con más indulgencia de la
que merece. Si te invocan en la misma sesión (comprueba el historial: si hoy has tocado `js/`,
`css/` o `docs/spec.md`, eres esa sesión), sigue adelante — mejor un análisis con este aviso que
ninguno — pero dilo al principio del documento, en la sección 1:

> ⚠️ Este análisis lo ha hecho la misma sesión que escribió el código documentado. Es una
> limitación real: pídele a alguien (persona u otra sesión de Claude Code) que lo repase antes de
> usarlo como referencia de onboarding.

## El documento: `docs/auditoria-tecnica.md`

Genera **exactamente** estas 30 secciones, en este orden. Explica cada concepto técnico la
primera vez que aparece (qué es un principio SOLID, qué es un patrón de diseño, qué es deuda
técnica) y comenta los fragmentos de código importantes, no solo los referencies por línea: el
documento tiene que servir para alguien que llega nuevo al proyecto.

1. Resumen ejecutivo del sistema
2. Stack tecnológico
3. Arquitectura general
4. Estructura del repositorio
5. Puntos de entrada del sistema
6. Mapa completo del front-end
7. Mapa de transiciones entre vistas
8. Flujo completo de guardado/persistencia de datos
9. Trazabilidad de flujos (contra el spec del proyecto y las etiquetas de requisito de los tests)
10. Dependencias entre componentes
11. Principios SOLID: aplicados o incumplidos, con archivo y línea
12. Patrones de diseño y programación usados
13. Otras prácticas de ingeniería
14. Explicación pedagógica del código: para alguien que nunca vio este repo
15. Manejo de errores
16. Seguridad: si lo que escribe el usuario se escapa antes de pintarse en pantalla, si hay
    claves, contraseñas o datos que no deberían estar, y qué archivos se publicarían sin hacer
    falta para que la app funcione (documentación interna, tests, CLAUDE.md, material de
    referencia)
17. Puntos críticos del código
18. Deuda técnica y code smells
19. Sugerencias de mejora (sin implementarlas)
20. Impacto de modificaciones: qué archivos toca cambiar si se agrega algo, y qué se rompe
21. Diagramas de flujo (en texto, tipo Mermaid)
22. Índice de archivos importantes
23. Glosario técnico del proyecto
24. Diseño responsive: si algo se rompe, se solapa o se desborda en móvil (375px), tablet (768px)
    y escritorio (1440px), revisando los breakpoints que existen — mide con código
    (`getBoundingClientRect` de cada elemento contra `innerWidth`), no solo con una captura: una
    captura a un ancho estrecho puede tener su propio artefacto de escala y parecer rota sin
    estarlo
25. Problemas de despliegue: rutas, carga de datos y cualquier cosa que funcione en local pero
    pueda fallar publicada
26. Matriz final de trazabilidad (requisito → dónde vive en el código → qué test lo cubre)
27. Nombres de marca, cliente o material con derechos que no deberían quedar públicos en un
    repositorio compartido o publicado (rutas de archivos, comentarios, assets, nombres de
    carpeta)
28. Arreglos rápidos que harías antes de publicar, incluido un `.surgeignore` (o equivalente) con
    lo que no debe subirse
29. Clasificación de cada hallazgo como crítico, alto, medio o bajo, con archivo y línea
30. Conclusiones del análisis

## Reglas

- No reescribas ni modifiques ningún archivo de código, configuración o test.
- No publiques nada ni ejecutes ningún comando de despliegue (`surge`, `netlify`, `vercel`...).
- Cita archivo y línea en cada hallazgo, nunca una descripción vaga ("en algún sitio del CSS").
- Explica cada concepto técnico la primera vez que aparece; comenta los fragmentos de código
  importantes.
- Al terminar, resume en tu respuesta (no solo en el documento): cuánto tardó, cuántas líneas
  tiene `docs/auditoria-tecnica.md`, y si encontraste algo en la sección 27 (marca/cliente) o
  algo crítico en la 29.

## Lo que esta skill nunca hace

- No toca `js/`, `css/`, `index.html`, `data/tickets.json` ni ningún test.
- No crea el `.surgeignore` real ni ningún archivo salvo `docs/auditoria-tecnica.md`: el
  `.surgeignore` propuesto va dentro del documento (sección 28), en un bloque de código, para que
  una persona lo revise antes de que exista.
- No publica ni despliega nada por su cuenta.
