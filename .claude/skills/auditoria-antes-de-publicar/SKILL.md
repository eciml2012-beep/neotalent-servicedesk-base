---
name: auditoria-antes-de-publicar
description: Auditoría técnica completa del Mini Service Desk antes de publicarlo en un hosting estático (Surge, Netlify, GitHub Pages...). Revisa seguridad (XSS, secretos, qué archivos se publicarían sin hacer falta), diseño responsive a 375/768/1440 px, problemas de despliegue y arquitectura, y entrega un único informe en docs/auditoria.md apto para alguien nuevo en el proyecto, con un .surgeignore propuesto. Úsala siempre que el usuario diga "auditoría", "audita el repo", "antes de publicar/desplegar", "qué se subiría a producción", "revisa antes de publicar", "haz un surgeignore" o esté a punto de ejecutar `surge`, `netlify deploy` o similar — aunque no la nombre. Nunca publica ni modifica nada por su cuenta: solo escribe el informe y se detiene a esperar revisión humana.
---

# Auditoría antes de publicar

Antes de que este repo (o cualquier fork suyo) se publique en un hosting estático, alguien tiene
que mirar qué se va a subir de verdad. Un `surge` o un `netlify deploy` lanzado desde la raíz del
repo publica **todo lo que hay en disco**, no solo lo que necesita la app: si nadie lo revisa
antes, se sube `CLAUDE.md`, `docs/`, los tests y cualquier material de referencia junto al
`index.html`. Ya pasó una vez en una prueba de despliegue (23-sep-2026): se publicaron
`CLAUDE.md`, `docs/` y el logo del cliente sin que nadie lo pidiera.

Esta skill hace la auditoría y escribe un informe. **No corrige nada, no crea el `.surgeignore`
de verdad y no publica nada.** Eso lo decide una persona después de leer el informe.

## Quién debería ejecutarla

Idealmente, **una sesión de Claude Code distinta de la que escribió el código que audita**. Quien
escribió algo tiende a revisarlo con buenos ojos, aunque no se lo proponga — es el mismo motivo
por el que un desarrollador no debería ser el único revisor de su propio pull request.

Si te invocan en la misma sesión que escribió el código (compruébalo mirando el historial de la
conversación: si hoy has tocado `js/`, `css/` o `docs/spec.md`, eres esa sesión), **sigue
adelante igualmente** — es mejor una auditoría con este aviso que ninguna — pero dilo con estas
palabras exactas al principio del informe, en la sección "Cómo se hizo esta auditoría":

> ⚠️ Esta auditoría la ha hecho la misma sesión que escribió el código revisado. Es una limitación
> real, no una formalidad: pídele a alguien (persona u otra sesión de Claude Code) que la repase
> antes de dar los hallazgos por buenos.

## El principio de fondo: comprobado, no interpretado

Cada afirmación del informe tiene que venir de haber mirado el código o haberlo ejecutado, no de
suponer por el nombre de un archivo o de una carpeta. `docs/pruebas/` "suena" a que solo tiene
pruebas, pero solo lo sabes si lo abres. Un archivo llamado `.env.example` puede estar vacío o
puede tener una clave de verdad — solo lo sabes leyéndolo.

Por eso, en cada hallazgo, di explícitamente si es:
- **Comprobado**: lo leíste, lo ejecutaste o lo mediste con código. Cita cómo.
- **Interpretado**: es tu lectura razonable de algo que no pudiste comprobar del todo (por
  ejemplo, el comportamiento por defecto de una herramienta de despliegue que no está instalada).

Un informe que mezcla las dos cosas sin avisar no sirve para decidir nada.

## Las cuatro áreas a revisar

### 1. Seguridad

- **Inyección de HTML/XSS**: busca en `.js` `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, `eval(` y `new Function(` — si el texto que escribe el usuario (o que trae el
  dataset) llega a la pantalla por ahí, no por `textContent`, es una vía de inyección. Grep no
  basta como prueba por sí solo: abre los archivos que encuentres y confirma que de verdad pintan
  contenido dinámico, no solo la palabra suelta en un comentario.
- **Secretos**: busca claves, contraseñas, tokens, patrones de credenciales (`api_key`, `secret`,
  `password`, `Bearer `, `AKIA`, `sk-`, bloques `-----BEGIN...KEY-----`) y archivos `.env`,
  `*.pem`, `id_rsa*`. Excluye `node_modules/`, `.git/`, y las carpetas de artefactos de test
  (`test-results/`, `playwright-report/`) de la búsqueda de texto, pero **no** de la lista de qué
  se publicaría — eso va en el punto siguiente.
- **Qué se publicaría sin hacer falta**: lista, mirando la raíz del repo con `ls -la` (no de
  memoria), todo lo que no sea `index.html`, la carpeta que cargan sus `<link>`/`<script>`, y los
  datos que la app pide por `fetch` en tiempo de ejecución. Todo lo demás — documentación interna
  (`CLAUDE.md`, `docs/`), instrucciones de Claude Code (`.claude/`), tests (`tests/`,
  `playwright.config.js`), artefactos de test generados en disco aunque estén en `.gitignore`
  (`test-results/`, `playwright-report/` sí existen en el filesystem y un despliegue por
  filesystem los publica igual), configuración de paquetes (`package.json`,
  `package-lock.json`, `node_modules/`) y material de referencia o de marca (`assets/`,
  `deep-research/`) — es candidato a excluir. Decide caso por caso si hace falta para que la app
  *funcione en el navegador*, no si "no pasa nada" por publicarlo.

### 2. Diseño responsive (375 / 768 / 1440 px)

**No te fíes solo de una captura de pantalla a un ancho estrecho**: las herramientas de captura
pueden tener su propio artefacto de escala y mostrar texto que parece cortado sin que la página
tenga ningún problema real. Mide con código, en un navegador de verdad, contra las rutas reales de
la app (bandeja, ficha, corregir, métricas, y cualquier modal):

```js
const w = innerWidth;
const offenders = [...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > w + 2 || el.getBoundingClientRect().left < -2);
({ scrollWidth: document.documentElement.scrollWidth, w, offenders: offenders.length })
```

Si `offenders` es 0 y `scrollWidth` no pasa de `w`, no hay desbordamiento real, aunque una captura
sugiera lo contrario. Revisa también los `@media` que ya existen en el CSS (`grep -n "@media"`) y
si cubren los tres anchos pedidos o dejan un hueco entre ellos.

### 3. Problemas de despliegue

- Rutas relativas vs. absolutas en `fetch`, `<link href>`, `<script src>`: en un hosting estático
  el origen cambia, así que cualquier ruta absoluta a `localhost` o a un puerto de desarrollo
  rompe en producción.
- Cómo se cargan los datos (`fetch` a un JSON local, cabeceras de caché) y si algo asume que el
  servidor de desarrollo se comporta igual que el hosting final (por ejemplo, cabeceras
  `Content-Type`, soporte de rutas con `#` o con historial).
- Enrutado: si la app usa `location.hash`, no hace falta configurar reescritura de rutas en el
  servidor (`#/lo-que-sea` nunca llega al servidor); si usa la History API, sí, y hay que
  comprobar si el hosting lo soporta.

### 4. Arquitectura

Describe, mirando las importaciones reales (`import`/`<script src>`), no la estructura de
carpetas: qué archivo hace de punto de entrada, qué módulo hace la única llamada de red, cómo se
combinan los datos que llegan de esa llamada con lo que hay guardado en el navegador, y en qué
módulo se pinta finalmente cada dato en el DOM. Un diagrama de texto corto vale más que un listado
de archivos.

## Clasificación de hallazgos

Cada hallazgo: **crítico / alto / medio / bajo**, con el archivo y la línea (o el rango) donde
está. Una guía, no una tabla cerrada:

| Severidad | Cuándo |
|---|---|
| Crítico | Un secreto real expuesto, una inyección explotable, o la app rota en producción |
| Alto | Documentación interna o material no público que se publicaría; un desbordamiento real en un ancho pedido |
| Medio | Archivos innecesarios mayores que revelan estructura interna sin ser secretos (config de tests, de paquetes) |
| Bajo | Mejoras de higiene sin impacto directo (por ejemplo, un `README` de más) |

## El informe: `docs/auditoria.md`

Un único documento, escrito para alguien que **llega nuevo al proyecto** — explica cada término
técnico la primera vez que aparece (qué es XSS, qué es un breakpoint, qué hace `.surgeignore`),
en vez de darlo por sabido. Incluye fragmentos de código comentados en los hallazgos importantes,
no solo la referencia a la línea.

Estructura sugerida:

1. **Cómo se hizo esta auditoría** — incluye el aviso de "misma sesión" si aplica, y qué se
   comprobó ejecutando código frente a qué se interpreta.
2. **Resumen** — cuántos hallazgos de cada severidad, y los 3-5 más importantes en una frase cada
   uno.
3. **1. Seguridad**, **2. Responsive**, **3. Despliegue**, **4. Arquitectura** — cada hallazgo con
   severidad, archivo:línea, qué pasa, por qué importa, y si es comprobado o interpretado.
4. **Arreglos rápidos antes de publicar** — una lista corta y accionable, ordenada por severidad.
5. **`.surgeignore` propuesto** — el contenido completo, comentado, listo para copiar. No lo crees
   como archivo real todavía: va dentro del informe, en un bloque de código, para que la persona
   lo revise antes de que exista.

Termina el informe con una línea clara: **"Nada de esto se ha aplicado. No se ha modificado
ningún otro archivo ni se ha publicado nada."**

## Lo que esta skill nunca hace

- No ejecuta `surge`, `netlify deploy`, `vercel` ni ningún comando de publicación.
- No crea el `.surgeignore` real, ni toca `data/tickets.json`, ni cambia código de la app. Solo
  escribe `docs/auditoria.md`.
- No decide qué arreglar: enumera y clasifica, la decisión de aplicar los arreglos es de una
  persona (o de un prompt aparte, después de que alguien haya leído el informe).
