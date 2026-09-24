# Auditoría antes de publicar — Mini Service Desk

Hecha con la skill global `auditoria-antes-de-publicar` (en `~/.claude/skills/`, no en este repo) el
24/09/2026, antes de un despliegue en Surge.
Este documento **no modifica nada**: es un informe para que una persona decida qué arreglar.

## 1. Cómo se hizo esta auditoría

> ⚠️ Esta auditoría la ha hecho la misma sesión que escribió el código revisado (hoy: R9, el
> rediseño de la vista C, R10 y las capturas de referencia). Es una limitación real, no una
> formalidad: pídele a alguien (persona u otra sesión de Claude Code) que la repase antes de dar
> los hallazgos por buenos.

Todo lo marcado **Comprobado** viene de leer el archivo indicado, ejecutar un comando (`grep`,
`ls`, `du`) o medir en un navegador real con código JavaScript — nunca de suponer por el nombre de
una carpeta. Lo marcado **Interpretado** es una lectura razonable de algo que no se pudo verificar
del todo (por ejemplo, cómo se comportaría exactamente `surge` sin haberlo ejecutado).

## 2. Resumen

| Severidad | Hallazgos |
|---|---|
| Crítico | 0 |
| Alto | 2 |
| Medio | 3 |
| Bajo | 2 |

Lo más importante en una frase cada uno:

1. **No hay ningún secreto ni clave expuesta** (comprobado, búsqueda por patrones en todo el repo).
2. **No hay ninguna vía de inyección HTML/XSS**: el código nunca usa `innerHTML` ni similares, solo `textContent` (comprobado, `grep` + lectura de cada resultado).
3. **Publicar tal cual desde la raíz subiría `.claude/`, `docs/`, `tests/` y material de diseño** que no hace falta para que la app funcione — es justo lo que ya pasó una vez (23-sep-2026).
4. **`assets/referencias/securitas-verisure/`** nombra dos marcas reales de la competencia (vacía de capturas, pero el nombre de la carpeta y su README las citan).
5. **A 375, 768, ~1024 y 1440 px no hay ningún desbordamiento real**, medido con código, no solo con capturas.

## 3. Hallazgos

### 3.1 Seguridad

**[ALTO] Publicar desde la raíz sube contenido interno innecesario**
*Comprobado* — `ls -la` en la raíz del repo (24/09/2026):

```
.claude/            85 KB   — instrucciones y skills de Claude Code, metodología interna
.git/               5.7 MB  — historial completo del repo
.github/                    — workflow de CI
docs/               476 KB  — spec, constitución, QA, wireframes, esta misma auditoría
deep-research/       76 KB  — investigación previa al spec
assets/              1.7 MB — capturas de referencia de diseño (ver 3.1.3)
tests/                      — la suite de pruebas
playwright.config.js
package.json / package-lock.json / node_modules/  — 19 MB, solo hace falta para *probar*, no para *usar* la app
test-results/        5 KB   — artefactos de la última pasada de tests (generados, no en git, pero sí en disco)
playwright-report/   692 KB — informe HTML de la última pasada de tests (ídem)
CLAUDE.md            17 KB  — instrucciones internas del proyecto para Claude Code
README.md            7 KB   — documentación del repo (no de la app en sí)
```

Lo único que **necesita el navegador** para que la app funcione es `index.html`, `css/styles.css`,
todo `js/` (importado por `<script type="module" src="js/app.js">`) y `data/tickets.json` (el
único `fetch` de toda la app, ver 3.4). Todo lo demás es documentación de trabajo, herramientas de
desarrollo o material de diseño: no rompe la app si se excluye, y si se publica, expone cómo se
construyó el proyecto, la metodología de `.claude/`, y el histórico completo en `.git/`.

**[MEDIO] `test-results/` y `playwright-report/` están en `.gitignore` pero no en ningún
`.surgeignore`**
*Comprobado* — `cat .gitignore` (líneas 6-7: `test-results/`, `playwright-report/`) confirma que
no están en git. Pero `surge` publica el **sistema de archivos**, no el repositorio git: si
alguien ha corrido `npm test` antes de publicar (lo normal, es la puerta de commit del proyecto),
esas dos carpetas existen en disco — 5 KB y 692 KB respectivamente, comprobado con `du -sh` — y se
subirían igual, aunque nunca lleguen a un commit. El informe HTML de Playwright incluye capturas
de la app con datos del dataset y detalles de la suite.

**[MEDIO] `assets/referencias/securitas-verisure/` nombra dos marcas reales de la competencia**
*Comprobado* — `assets/referencias/securitas-verisure/README.md`:

```markdown
# Securitas / Verisure

Webs públicas de empresas del sector de seguridad: tono, colores y forma de presentar alarmas e incidencias.

Solo como inspiración: no copiar logos ni marca.
```

La carpeta está **vacía de capturas** — el propio `assets/referencias/README.md` lo confirma: *"No
hay capturas de bentogrids.com ni de Securitas / Verisure: la búsqueda se cortó antes."* No hay
ningún logo ni imagen de esas marcas en el repo (comprobado, `find assets -type f` solo lista
capturas de `dribbble/` y `motionsites/`, ninguna en `securitas-verisure/`). Lo que sí queda
público, si se sube tal cual, es el **nombre de dos marcas reales** citado como referencia de
diseño de un competidor, en un README de un repo que podría acabar siendo visible. Bajo impacto
real (no hay contenido con derechos, solo un nombre), pero es justo el tipo de cosa que el
ejercicio pide vigilar.

**[BAJO] `CLAUDE.md` y `README.md` mencionan el nombre del cliente/formador (Neotalent)**
*Comprobado* — `README.md:4`: `**"del software"** (Neotalent Conclusion)`. Es el nombre de quien
imparte la formación, no un dato confidencial de terceros, pero sigue siendo información interna
del contexto del proyecto (de qué curso sale, qué sesiones tiene) que no aporta nada a quien solo
quiere usar la bandeja de tickets.

**[Sin hallazgo] Inyección HTML / XSS**
*Comprobado* — `grep -rn "innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|eval(\|new Function(" js/ index.html` no encuentra ninguna coincidencia. El texto dinámico (títulos, descripciones,
motivos, notas del operador) se pinta siempre con `textContent` — comprobado con `grep -rc
"textContent" js/**/*.js`: 55 usos en total, y confirmado además por que `tests/unit/constitucion.spec.js`
hace esta misma comprobación como puerta automática antes de cada commit.

**[Sin hallazgo] Secretos, claves o contraseñas**
*Comprobado* — búsqueda de patrones (`api[_-]?key`, `secret`, `password`, `Bearer `, `AKIA`,
`sk-...`, bloques `-----BEGIN...KEY-----`) en todo `.js`/`.json`/`.md`/`.html`/`.py`, excluyendo
`node_modules/`, `.git/` y los artefactos de test: **ningún resultado real**. Tampoco hay ningún
archivo `.env`, `.pem` ni `id_rsa*` en el repo. Coincide con la constitución del proyecto
(principio 6: sin API keys, la app nunca llama a ningún servicio externo) y con lo que ya
comprueba `tests/e2e/seguridad.spec.js` en cada pasada.

### 3.2 Diseño responsive (375 / 768 / 1440 px)

**[Sin hallazgo] Desbordamiento a los tres anchos pedidos**
*Comprobado* — medido con código en un navegador real, en las cuatro rutas de la app (`#/bandeja`,
`#/ticket/SVD-4102`, `#/ticket/SVD-4102/corregir`, `#/metricas`), contando cuántos elementos del
DOM sobresalen del viewport:

```js
const w = innerWidth;
const offenders = [...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > w + 2 || el.getBoundingClientRect().left < -2);
({ scrollWidth: document.documentElement.scrollWidth, w, offenders: offenders.length })
```

| Ancho | `scrollWidth` | Elementos que sobresalen |
|---|---|---|
| 375 px (móvil) | 375 | 0 |
| 768 px (tablet) | 753 | 0 |
| ~530–1024 px (intermedio) | 518 | 0 |
| 1440 px (escritorio) | 1440 | 0 |

En los cuatro casos `scrollWidth` no supera el ancho del viewport y ningún elemento se sale por
ningún lado, en las cuatro rutas. **Aviso metodológico:** una primera comprobación a 375 px con
una captura de pantalla parecía mostrar texto cortado en el borde derecho; medido con el código de
arriba resultó ser un artefacto de escala de la propia herramienta de captura, no un problema real
de la página — por eso esta auditoría no se apoya solo en capturas.

**[Sin hallazgo] Breakpoints del CSS**
*Comprobado* — `grep -n "@media" css/styles.css`: un único breakpoint, `@media (max-width: 900px)`
(línea 814), que cambia el `rail` de horizontal a apilado, oculta la lista o la ficha según cuál
esté activa, y pasa los filtros a una rejilla de dos columnas. Con un solo breakpoint a 900 px, los
tres anchos pedidos (375 y 768 caen en el lado "móvil"; 1440 cae en el lado "escritorio") quedan
cubiertos sin hueco entre ellos para este proyecto.

### 3.3 Problemas de despliegue

**[Sin hallazgo] Rutas relativas**
*Comprobado* — `index.html`: `<link rel="stylesheet" href="css/styles.css">` y `<script
type="module" src="js/app.js">`, ambas relativas, sin dominio ni puerto. `js/app.js:514`: `fetch("data/tickets.json", { cache: "no-store" })`, también relativa. Ninguna referencia a
`localhost` ni a un puerto de desarrollo en ningún archivo de `js/` o `index.html`. Esto significa
que la app funcionará igual sirviéndose desde cualquier origen (Surge, GitHub Pages, un
`http.server` local), sin cambios.

**[Sin hallazgo] Enrutado**
*Comprobado* — `js/app.js:199` y `:209` usan `location.hash`, no la History API. Las rutas
(`#/bandeja`, `#/ticket/:id`, `#/ticket/:id/corregir`, `#/metricas`) nunca llegan al servidor: el
navegador las resuelve solas. *Interpretado:* esto quiere decir que **no hace falta ninguna
configuración de reescritura de rutas** en Surge (el `index.html` de la raíz sirve para cualquier
URL con `#`), a diferencia de una app con History API, que sí necesitaría esa configuración.

**[Sin hallazgo] Carga de datos**
*Comprobado* — un único `fetch`, en `js/app.js:514`, con `{ cache: "no-store" }` para evitar que
el navegador sirva una copia cacheada de `data/tickets.json` tras un redeploy. *Interpretado:* en
un hosting estático normal esto sigue funcionando igual que en local, siempre que
`data/tickets.json` se publique (está dentro de lo que sí hace falta subir).

### 3.4 Arquitectura

*Comprobado* — trazado siguiendo los `import` reales de `js/app.js` y el resto de `js/`:

```
index.html
  └─ carga js/app.js (único punto de entrada, type="module")
       │
       ├─ fetch("data/tickets.json")           ← única llamada de red de toda la app
       │
       ├─ localStorage["svd-triaje"]           ← confirmaciones, notas, tickets creados a mano
       ├─ localStorage["svd-tema"]             ← tema claro/oscuro
       │
       ├─ js/utils/estado-ticket.js#derivarTicket(ticketOriginal, triajeGuardado)
       │     combina el dato con lo confirmado antes de que llegue a ningún componente
       │
       ├─ js/components/*.js (fila-ticket, ficha-ticket, barra-filtros, panel-metricas,
       │   nuevo-ticket, campo-texto)
       │     pintan el DOM con textContent; no hacen fetch ni tocan localStorage directamente
       │
       └─ render() (dentro de js/app.js)
             limpia #app y repinta según location.hash en cada hashchange
```

Un dato entra por el único `fetch` de `js/app.js`, se combina con lo que haya en `localStorage`
dentro de `derivarTicket`, y de ahí pasa a los componentes de `js/components/` solo por parámetro
— ninguno de ellos vuelve a tocar la red ni el almacenamiento por su cuenta (comprobado con `grep
-rln "fetch(" js/` fuera de `app.js`: ningún resultado). Esta separación es la misma que
documenta `CLAUDE.md` y la comprueba `tests/unit/constitucion.spec.js` en cada pasada.

## 4. Arreglos rápidos antes de publicar

En orden de severidad:

1. **[Alto]** Crear el `.surgeignore` de la sección 5 y publicar con él, no con `surge` a secas.
2. **[Medio]** Confirmar que `test-results/` y `playwright-report/` no existen en el directorio
   desde el que se publica, o que están en el `.surgeignore` (están incluidos en la propuesta de
   abajo).
3. **[Medio]** Decidir si `assets/referencias/` se publica. Recomendación: excluirla — no aporta
   nada a quien usa la app y nombra marcas de la competencia sin necesidad.
4. **[Bajo]** Si el repo va a quedar visible más allá de este curso, revisar si `README.md` y
   `CLAUDE.md` deberían mencionar el nombre del formador/cliente tal como está, o si es indiferente
   por ser información pública del propio curso.

## 5. `.surgeignore` propuesto

No creado todavía como archivo real — para revisar antes de que exista:

```
# .surgeignore — Mini Service Desk
# La app solo necesita index.html, css/, js/ y data/tickets.json.
# Todo lo demás es documentación de trabajo, herramientas de desarrollo o material de diseño:
# no hace falta para que la app funcione en el navegador (docs/auditoria.md, 24/09/2026).

# Instrucciones y skills internas de Claude Code
.claude/

# Documentación del proyecto (spec, constitución, QA, wireframes, esta auditoría)
docs/
deep-research/
CLAUDE.md
README.md

# Material de diseño de referencia (nombra marcas de terceros; no lo usa la app)
assets/

# Suite de pruebas y su configuración
tests/
playwright.config.js
test-results/
playwright-report/

# Herramientas de desarrollo (constitución, principio 6: la app no las necesita)
node_modules/
package.json
package-lock.json

# Control de versiones y CI
.git/
.github/
.gitignore
.gitattributes

# Otros artefactos locales
.playwright-mcp/
```

## 6. Arreglos aplicados (24/09/2026, tras revisión)

Aplicados los 3 arreglos de severidad alto/medio, los tres resueltos por el mismo archivo:

- ✅ Creado `.surgeignore` con el contenido propuesto en la sección 5.
- ✅ Comprobado (simulando la exclusión sobre `ls` de la raíz): lo que quedaría publicado es
  exactamente `css/`, `data/`, `index.html`, `js/` — nada de `.claude/`, `docs/`, `tests/`,
  `assets/`, `node_modules/` ni `.git/`.
- ✅ `npm test` completo tras el cambio: 284/284 en verde (el `.surgeignore` no toca ningún
  archivo de la app, así que no se esperaba ni se encontró ninguna regresión).
- El hallazgo [Bajo] (README/CLAUDE.md nombran al formador) queda cubierto por el mismo
  `.surgeignore`: ambos archivos están excluidos, así que no llegan a publicarse.

**No se ha publicado nada todavía.** Publicar (`surge`) sigue pendiente de confirmación explícita
y del dominio (`servicedesk-grupo-N.surge.sh`, con `N` = número de sala).
