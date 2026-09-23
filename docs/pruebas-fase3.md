# Registro de pruebas — Fase 3 (23/09/2026)

No hay framework de test instalado (principio 6, constitución): los tests automatizados y
repetibles son trabajo de la **Fase 4** (Sesión 4), según la hoja de ruta de `CLAUDE.md`.

Lo de aquí abajo es otra cosa: la app se probó **dirigiendo un navegador real** (Claude Browser,
contra `python -m http.server`) con scripts de un solo uso que no quedan guardados en ningún
sitio del repo. Este documento es el registro de qué se probó, cómo, y qué salió — para que no se
pierda al cerrar la conversación donde se hizo.

## Bugs encontrados y corregidos (3)

| # | Bug | Cómo se encontró | Dónde se arregló |
|---|---|---|---|
| 1 | En modo Corregir, si la categoría pasaba por «Sin clasificar» y volvía a una real sin tocar el desplegable de Impacto, la variable interna quedaba en `null` mientras el `<select>` mostraba «Alto» por defecto del navegador. Se podía guardar una combinación imposible (categoría real + impacto `null`). | Relectura de `ficha-ticket.js` línea a línea, no pruebas de clic | `js/components/ficha-ticket.js` — misma reconciliación por zona que ya tenía la urgencia, aplicada también al impacto |
| 2 | El aviso «hay cambios sin exportar» no reaparecía si, tras exportar, el operador pulsaba Deshacer sobre el único ticket confirmado: `Deshacer` borraba la entrada entera, y comparar solo por `fecha` perdía la señal. | Repaso de casos límite del spec uno por uno (no solo los 9 criterios de finalización) | `js/app.js` — timestamp `_meta.ultimaModificacion` separado de las entradas por ticket |
| 3 | El punto 11 de la 2ª revisión QA (si `data/tickets.json` ya trae `triaje`, manda sobre `localStorage`) no estaba implementado. Al probarlo, salió un cuarto problema: el `fetch` sin `cache: "no-store"` podía servir una copia de `tickets.json` cacheada por el navegador y no ver el archivo real en disco — habría roto justo este flujo. | Auditoría de R6 contra el código | `js/app.js` — `sembrarTriajeDesdeJSON()` + `fetch(..., { cache: "no-store" })` |

## Cobertura funcional probada

| Área | Cómo se probó | Resultado |
|---|---|---|
| Bandeja: carga, orden (Sin clasificar → prioridad → confirmados), filtro por defecto | Clics reales + lectura del DOM | ✅ |
| Ficha ver: Aceptar visible/oculto, Deshacer deshabilitado/activo según estado | Clics reales | ✅ |
| Sin clasificar: sin botón Aceptar | Clics reales | ✅ |
| R8 en Corregir, las 7 categorías: Brecha (urgencia fija Alta), Petición de acceso y de información (fija Baja), Falsa alarma (excluye Alta), Equipo averiado / Pérdida de registro / Fallo de integración (libres) | Cambiar el `<select>` de categoría y leer las opciones resultantes de urgencia | ✅ las 7 |
| ~~«Guardar sin cambiar nada» sobre un ticket ya Corregido → pasa a Confirmado~~ | Corregir dos veces seguidas sobre el mismo ticket | ❌ **La aserción estaba mal**: ese comportamiento era un bug (ver la auditoría de abajo, hallazgo 1). Lo correcto es que siga Corregido |
| Exportar: JSON con 60 tickets, `triaje: null` en pendientes, estado correcto en revisados, aviso desaparece | Interceptar `URL.createObjectURL` y leer el Blob generado | ✅ |
| Filtro «Todos» con pendientes + confirmados + corregidos mezclados | Cambiar el filtro y comprobar orden y conteo | ✅ |
| Ticket inexistente por URL (`#/ticket/SVD-9999`) | Navegación directa por hash | ✅ no rompe la app |
| `localStorage` bloqueado (cuota llena / incógnito estricto) | Se sobrescribió `setItem` para que lance una excepción | ✅ la app sigue funcionando en memoria y avisa, sin pantalla en blanco |
| Métricas: conteo de revisados, tasa de corrección global y por categoría | Confirmar/corregir tickets y leer el panel | ✅ |
| Tema oscuro persiste tras recargar la página | `localStorage` + recarga real | ✅ |
| La matriz de prioridad (R3), las 9 combinaciones | Se llamó a `calcularPrioridad()` importando el módulo real, no una copia | ✅ 9/9 |
| La validación de coherencia (R8) contra los 60 tickets reales | Se llamó a `esSugerenciaCoherente()` importando el módulo real sobre `data/tickets.json` | ✅ 0 incoherencias |

## Falsos positivos de las pruebas (errores míos, no de la app)

Quedan anotados porque forman parte de cómo se llegó al resultado, no para esconderlos:

- Esperaba impacto «Alto» en un ticket de Nave logística 2 (no es zona crítica); el valor
  correcto era «Medio» y la app lo dio bien.
- Busqué el texto «REVISADOS» en mayúsculas; el DOM tiene «Revisados» y las mayúsculas son solo
  CSS (`text-transform`), no cambian el texto real.
- Al probar `localStorage` bloqueado no limpié el estado de una prueba anterior, así que esperaba
  60 filas pendientes cuando ya había 3 tickets confirmados de antes: lo correcto era 57.

## Auditoría completa contra el spec (23/09/2026, segunda pasada)

Relectura del spec requisito por requisito contra todo el código, sin fiarse de las pruebas de
arriba. Salieron 3 bugs más, 4 huecos y varias reglas de `docs/diseno.md` sin cumplir.

| # | Tipo | Hallazgo | Arreglo |
|---|---|---|---|
| 1 | Bug (R5, R7) | «Corregido» se medía contra el último valor guardado, no contra la sugerencia de la IA. Reabrir un Corregido y guardarlo sin tocar lo pasaba a Confirmado, y la tasa de corrección decía que la IA acertó. **Una prueba anterior lo daba por bueno.** | `estadoAlGuardar()` en `utils/estado-ticket.js`, compara contra `sugerenciaEfectiva`. Precisado en `spec.md` R5 |
| 2 | Bug (R6 p. 11) | La siembra desde un `data/tickets.json` con `triaje` se repetía en cada recarga: pisaba lo que el operador hacía después (corregir, deshacer) | `_meta.sembrados` guarda la huella de lo ya sembrado; solo se vuelve a sembrar si el JSON cambia |
| 3 | Bug (R7) | La tasa de corrección por categoría se agrupaba por la categoría final, no por la sugerida: escondía justo la categoría en la que falla la IA | `calcularMetricas` agrupa por `sugerenciaEfectiva.categoria`. Precisado en `spec.md` R7 |
| 4 | Hueco (R8, casos límite) | Una sugerencia inválida se convertía en «Sin clasificar» en silencio y enseñaba el motivo de la clasificación descartada | Aviso en la fila y en la ficha; el motivo descartado ya no se enseña |
| 5 | Hueco (decisión 4) | «Sin clasificar sale destacado»: solo iba primero, sin distinción visual | Borde de 2 px (distinción que no depende del color) |
| 6 | Hueco (R4) | El filtro por estado del triaje solo tenía Pendientes y Todos | Añadidos Confirmados y Corregidos |
| 7 | Hueco (casos límite) | Las confirmaciones de ids que ya no existen se ignoraban pero no se descartaban | `descartarHuerfanos()` al cargar |
| 8 | Caso nuevo (R4) | Si la IA dijo «Sin clasificar» y el operador lo deja igual, guardar produciría «Sin clasificar» + Confirmado, la combinación imposible | Guardar deshabilitado con explicación |
| 9 | `diseno.md` | Textos a 11 px, controles a 36–40 px, rojo en avisos que no son brechas, ámbar/verde de abierto/cerrado sin usar | 12 px mínimo, 44 px en controles, avisos en ámbar, estado del ticket coloreado |
| 10 | Robustez | Exportar: el enlace de descarga no estaba en el documento y la URL se revocaba en el acto (Firefox puede cancelar la descarga) | Se añade al documento y se revoca en el siguiente tick |

Verificado en el navegador (38 comprobaciones, todas bien), incluidos los casos límite de
sugerencia inválida llamando a `derivarTicket()` con tickets inventados, porque el dataset real no
tiene ninguno. `data/tickets.json` quedó intacto (el `triaje` de prueba se añadió y se quitó).

## Qué no se ha probado

- **Vista en pantalla pequeña.** El CSS tiene una media query para ≤900px, pero no se ha mirado
  con los ojos en un viewport real.
- **Accesibilidad con teclado y lector de pantalla.** Los elementos son semánticos (`<button>`,
  `<select>` con `<label>` o `aria-label`), pero no se ha probado el orden de tabulación ni con un
  lector de pantalla real.
- **Tests automatizados y repetibles.** Todo lo de este documento se hizo con scripts de un solo
  uso contra un navegador real; no queda nada que se pueda volver a ejecutar con un comando. Es
  trabajo de la Fase 4.
