# Informe de pruebas — Mini Service Desk

*Test Completion Report* según **ISO/IEC/IEEE 29119-3**. Plan: `docs/pruebas/plan-de-pruebas.md`.
Trazabilidad: `docs/pruebas/matriz-trazabilidad.md`. Pruebas manuales anteriores:
`docs/pruebas-fase3.md`.

**Fecha:** 23/09/2026 · **Entorno:** Windows, Node 24, Playwright 1.63.0, Chromium ·
**Comando:** `npm test`

## Resumen

| | |
|---|---|
| Pruebas automatizadas | **265** en 21 archivos (128 en Node: unitarias, datos, estáticas e integración; 137 en navegador) |
| Resultado | **265 / 265 en verde**, ~31 s |
| CI (GitHub Actions, Linux) | Corren todas menos las 11 `@visual`, cuyas capturas son de Windows |
| Estabilidad | Las e2e, ejecutadas 3 veces cada una: 0 intermitentes |
| Requisitos sin prueba | **Ninguno** (P1–P6, R1–R9, CF1–CF10, casos límite) |
| Cobertura JS (V8, aproximada) | **98,1 %** (umbral de la suite: 95 %) |
| Mutación manual | **11 / 11** bugs sembrados detectados (8 de la Fase 3 y 3 de R9) |
| Defectos encontrados en esta pasada | 1 en la app, 6 en las propias pruebas |
| UAT con persona | **Pendiente** (`docs/pruebas/uat.md`) |

## Resultados por tipo

| Tipo | Archivos | Pruebas | Resultado |
|---|---|---|---|
| Estáticas (constitución, arquitectura, `innerHTML`) | `unit/constitucion` | 19 | ✅ |
| Unitarias (matriz, coherencia, estado, filtros, métricas, formato) | `unit/prioridad`, `estado-ticket`, `filtros`, `formato` | 72 | ✅ |
| Datos | `unit/dataset` | 14 | ✅ |
| Integración de componentes | `unit/integracion` | 3 | ✅ |
| Integración de sistemas (ida y vuelta del export, contrato con Claude Code) | `e2e/integracion` | 4 | ✅ |
| Sistema funcional (incluye XSS en casos límite) | `e2e/bandeja`, `ficha`, `persistencia`, `metricas`, `casos-limite` | 66 | ✅ |
| Aceptación automatizada (7 historias) | `e2e/aceptacion` | 7 | ✅ |
| Accesibilidad WCAG 2.2 AA + reglas de diseño | `e2e/accesibilidad` | 18 | ✅ |
| Seguridad (peticiones externas, sin conexión) | `e2e/seguridad` | 2 | ✅ |
| Regresión visual (5 pantallas × 2 temas + móvil) | `e2e/visual` | 11 | ✅ (referencias sin aprobar por una persona) |
| Rendimiento | `e2e/rendimiento` | 3 | ✅ |
| Cobertura | `e2e/cobertura` | 1 | ✅ |

## Defectos en la app

| # | Defecto | Cómo se encontró | Arreglo | Requisito |
|---|---|---|---|---|
| D1 | El nombre del export usaba la fecha **UTC**: entre las 00:00 y las 02:00 (hora de España) el archivo salía con la fecha de ayer | Valor límite: exportar a las 00:30 en `Europe/Madrid` con el reloj fijado | `fechaLocal()` en `js/utils/formato.js`, con su test unitario | R6 |

Los defectos de pasadas anteriores (6) están en `docs/pruebas-fase3.md`; todos tienen ahora una
prueba que los detectaría si volvieran.

## Defectos en las propias pruebas

Se anotan porque sin ellos el resultado no sería creíble: cada uno habría dado un falso rojo o,
peor, un falso verde.

| # | Error | Efecto | Arreglo |
|---|---|---|---|
| T1 | Los estáticos de arquitectura buscaban `localStorage` también en los **comentarios** | Falso rojo | Se quitan los comentarios antes de buscar |
| T2 | El servidor de pruebas tenía cola de 5 conexiones | Falso rojo intermitente (`ERR_CONNECTION_REFUSED`) con 8 navegadores | `request_queue_size = 128` en el arnés |
| T3 | El cálculo de contraste trataba `rgb(r, g, b)` sin alfa como **transparente** | Falso rojo masivo en el tema oscuro | Sin alfa = opaco |
| T4 | Un localizador de métricas coincidía con dos tarjetas ("Revisados" y "… revisados") | Falso rojo | Título exacto |
| T5 | La cobertura se perdía en cada `page.goto` (Chromium descarta los contadores al navegar) | Cobertura falsa del 41 % | Navegación por hash y recogida antes de cada recarga |
| T6 | El script de mutación restauraba los archivos con saltos de línea de Windows | 5 archivos marcados como modificados sin cambio real | Restaurados desde git; el script debe escribir con `newline=""` |

## Observaciones de UX (resueltas el 24/09/2026 con el rediseño)

1. **Densidad de la bandeja:** con motivos de ~190 caracteres cada fila mide ~180 px y caben 3 en
   pantalla. `diseno.md` pide "filas compactas" y el spec, decidir sin leer los 60 uno a uno.
2. **Rail en móvil:** funciona y no desborda, pero queda desordenado y ocupa ~230 px de alto.
3. **Columna de id:** 120 px para 8 caracteres, espacio que le falta al motivo.

## Riesgos residuales y qué no se ha probado

- **UAT con una persona:** pendiente. Hasta entonces las capturas de referencia no están aprobadas.
- **Firefox y WebKit:** sin probar (plan §8). El arreglo de la descarga para Firefox no está
  verificado en Firefox.
- **Lector de pantalla real:** sin probar; los nombres accesibles sí.
- **Calidad del motivo:** solo se comprueba que cite la zona; el resto, a mano (declarado en el spec).
- **Juicios de R2** ("una sola persona", "no graba ahora"): no automatizables.

## R9 · notas y motivo de corrección (23/09/2026)

**Alcance:** nuevo requisito R9 (notas del operador y motivo de corrección obligatorio en un
`Corregido`) tras enmendar el principio 3. Toca R5 (guardar), R6 (almacenamiento, export,
reimportación), P3 (datos personales) y la UI de la ficha. Archivos: `js/utils/texto-operador.js`
(nuevo), `js/utils/constantes.js`, `js/app.js`, `js/components/ficha-ticket.js`, `css/styles.css`.

**Cómo:** `npm test` completo; unitarias en Node (`unit/texto-operador`: largos, formas de dato
personal, unión de notas) y sistema en Chromium (`e2e/notas`, más H8/H9 en `e2e/aceptacion` y la
ida y vuelta en `e2e/integracion`). Las pruebas de R9 se ejecutaron 3 veces cada una (132/132, 0
intermitentes). Revisión a mano en el navegador de la nota y del bloqueo por DNI.

**Resultado:** 265 / 265 en verde (45 pruebas nuevas). Cobertura 98,1 %. Mutación manual, 3 / 3
detectados: `pareceDatoPersonal` que nunca detecta (11 pruebas en rojo), Guardar sin exigir motivo
(2) y Deshacer que borra las notas (1).

**Pruebas existentes que hubo que cambiar, y por qué:** 6 flujos de Corregir guardaban sin motivo y
ahora el spec lo exige (se añadió el motivo, no se relajó la regla); el test de "campos originales
intactos" del export ahora separa `notas`, que es campo nuevo; el de cobertura cuenta 11 archivos;
y las 4 capturas de la ficha y de Corregir se regeneraron (`npm run test:capturas`) porque la
pantalla cambió a propósito. **Hay que aprobarlas en la UAT.**

**Defectos de la app:** ninguno.

**Defectos de las propias pruebas:**

| # | Error | Efecto | Arreglo |
|---|---|---|---|
| T7 | Un caso daba `"y 1234567 l"` como "ni DNI ni NIE", pero R9 dice «con o sin espacio»: Y + 7 cifras + letra **es** forma de NIE | Falso rojo: la app tenía razón | Se decidió contra el spec: el caso pasa a esperar NIE y se añade `"a 1234567 l"` como caso sin NIE |

**Qué no se ha probado:** nombres propios en el texto del operador (no detectables, límite
declarado); Firefox y WebKit, igual que el resto de la suite.

## R10: "Nuevo ticket" (24/09/2026)

**Alcance:** nuevo requisito R10 (crear un ticket a mano, con un clasificador de reglas fijas, no
IA). Enmienda los principios 1 y 3 de la constitución. Flujo TDD completo: enseñado el diff de
constitución/spec, tests en rojo antes del código, código, refactor (`campo-texto.js` extraído de
`ficha-ticket.js` y reutilizado, la suite se mantuvo en verde antes y después).

**Cómo:** `npm test` completo; unitarias del clasificador en Node; sistema en Chromium
(`e2e/nuevo-ticket`); recorrido de `e2e/cobertura` ampliado para pasar por "Nuevo ticket".

**Resultado:** 283 / 283 en verde a la primera pasada (15 pruebas nuevas). Cobertura 97,1 %.

**Defectos de la app:**

| # | Defecto | Cómo se encontró | Arreglo | Requisito |
|---|---|---|---|---|
| D4 | Al crear un ticket solo se limpiaba el filtro de estado del triaje. Un filtro de sistema, zona o prioridad puesto antes dejaba el ticket nuevo creado pero invisible en la lista, sin ningún aviso | **A mano, por una persona probando la app** — ninguna de las 15 pruebas automáticas cubría "hay un filtro puesto antes de crear" | `app.js`: se limpian los cinco filtros de la bandeja al crear, no solo el de estado del triaje | R10 |

**Defectos de las propias pruebas:**

| # | Error | Efecto | Arreglo |
|---|---|---|---|
| T8 | Dos `<select>` con el mismo nombre accesible (el filtro de la barra y el del diálogo de "Nuevo ticket") daban locator ambiguo en varios tests nuevos | Falso rojo | Las consultas del formulario se limitan a `page.getByRole("dialog", ...)` |
| T9 | El nombre accesible de un `<select>` envuelto en `<label>` concatena el texto de **todas sus opciones**: "Reportado por" incluye la opción "Coordinador de zona", ambigua con el campo "Zona" | Falso rojo, y era también un fallo real de accesibilidad (un lector de pantalla leería las 12 opciones como parte del nombre del campo) | `aria-label` explícito en cada `<select>` de `nuevo-ticket.js` |
| T10 | La prueba del defecto D4 comprobaba el filtro justo tras pulsar "Crear ticket", sin esperar a que el diálogo se cerrara: coincidía con el `<select>` del propio formulario, todavía en el DOM | Falso rojo | Se espera `expect(page.getByRole("dialog")).toHaveCount(0)` antes de mirar el filtro |

**Qué esto dice del propio QA (rúbrica, punto Evidencia):** las 15 pruebas escritas antes de
enseñar el cambio pasaban en verde y aun así se escapó D4. La cobertura y el verde miden que el
código hace lo que los tests dicen, no que los tests cubran todos los casos: el hueco lo encontró
una persona probando a mano, no la suite. Se registra como recordatorio, no solo como defecto
cerrado.

**Rúbrica de 6 puntos:** Intención ✅ (R10 citado en los commits) · Alcance ✅ (`git diff --stat`
frente a lo pedido, más el refactor de `campo-texto.js` declarado en el paso 4) · Evidencia ✅
(284/284, con la salvedad de arriba) · **Propiedad ✅ — probado en el navegador por el operador**:
encontró D4 a mano (ticket oculto por un filtro) y, tras el arreglo, confirmó que el ticket sale en
su sitio correcto en la lista (3er puesto, por prioridad Alta) · Política ✅ (enmiendas de los
principios 1 y 3, enseñadas antes de tocar código) · Plan de respaldo ✅ (`v1.3-rediseno` +
`docs/vuelta-atras.md`; para deshacer solo R10: `git revert --no-edit 5b078a0 cd916c0 effb7a1
023ca54`).

## Rediseño: vista C con paleta índigo (24/09/2026)

**Alcance:** decisión de `docs/diseno.md` (rediseño del 24/09/2026). Lista y ficha lado a lado con
scroll independiente, aceptar/guardar pasa al siguiente pendiente, flechas ↑/↓ en la lista (roving
tabindex), paleta índigo en claro y oscuro, barra superior en vez de rail. Resuelve las tres
observaciones de UX de abajo. Sin cambios en `js/utils/`.

**Cómo:** `npm test` completo; revisión a mano en 1440, 1024 y 375 px.

**Resultado:** 265 / 265 en verde. Las 11 capturas de `@visual` se regeneraron: **pendientes de
aprobar**.

**Defectos de la app encontrados por la suite al rediseñar:**

| # | Defecto | Cómo se encontró | Arreglo |
|---|---|---|---|
| D2 | El fondo de la fila seleccionada con `color-mix()` no se podía medir y la prueba de contraste daba 1,28:1 | `@accesibilidad` (WCAG 1.4.3) | Color fijo `--color-seleccion`, medido ≥ 4,9:1 |
| D3 | Métricas desbordaba a 320 px de ancho (344 px) | `@accesibilidad` (WCAG 1.4.10) | Columna de etiqueta de las barras con `minmax(90px, 170px)` |

**Pruebas cambiadas, y por qué:** los ayudantes `aceptar` y `corregir` y la prueba de teclado
esperaban volver a `#/bandeja`; el diseño nuevo pasa al siguiente pendiente, así que ahora esperan
salir del ticket. Los textos del botón de tema pasan a minúscula («Tema: claro»).

## Recomendación

La app cumple el spec y la constitución en todo lo que se puede comprobar automáticamente.
**Apta para la demo**, pendiente de la UAT de `docs/pruebas/uat.md` y de decidir si las tres
observaciones de UX entran en la pasada de diseño de la Sesión 4.
