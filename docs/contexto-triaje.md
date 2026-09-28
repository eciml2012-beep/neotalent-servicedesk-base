# Contexto de la corrida de triaje

Memoria compartida del equipo de triaje (auditor → corrector → verificador → cronista).
Cada subagente empieza de cero: aquí queda lo que necesita saber el siguiente.

**Estado: cadena terminada el 28/09/2026 (segunda corrida del día).**

## Encargo original

- **Fecha:** 28/09/2026.
- **Tipo:** corrida de demostración para una clase. **Segunda corrida del día.**
- **Alcance:** los 60 tickets de `data/tickets.json`, cadena completa auditor → corrector →
  verificador → cronista.
- **Entregable:** resumen del cronista + lista de decisiones pendientes.

## Contexto que cambió lo que había que hacer

1. **Ya hubo una corrida hoy.** De ella salieron y **ya estaban aplicadas** en
   `js/utils/clasificador-nuevo-ticket.js`: `"sin respuesta"` (regla «Equipo de campo averiado»)
   y `"corte de grabación"` / `"corte de grabacion"` (regla «Pérdida de registro o evidencia»).
   No se volvieron a añadir.
2. **DECISIÓN CERRADA, NO SE TOCA:** el patrón «cámara sin grabar / pantalla en negro»
   (SVD-4113, 4128, 4143, 4158) se queda como «Sin clasificar» **a propósito**
   (decisión del 23/09/2026 en `docs/categorias-triaje.md`, con comentario en `REGLAS`).
   Se respetó: nadie añadió claves para ese patrón.
3. **Una corrida sin cambios es un resultado válido.**
4. **Entregable del cronista:** `docs/triaje-auditoria-28-09.md` YA EXISTE y no se pisa →
   sufijo `-2`.

## Alcance técnico (para todos)

- El clasificador de reglas solo sugiere para tickets **nuevos creados en el navegador** (R10).
- Las `sugerencia` del dataset **no se tocan**.
- Nadie de la cadena hace `git commit` ni `git push`. Se cumplió.
- El único archivo que edita el corrector es `js/utils/clasificador-nuevo-ticket.js`.

## 1. Hallazgos del auditor

**Resultado de categoría: 0 hallazgos nuevos.** Los 56 tickets clasificables casan con una clave
y la categoría que devolvería el clasificador coincide con la del dataset. Ningún falso positivo
por orden de reglas.

| id(s) | Categoría que daría el clasificador | Estado | Clave del texto |
|---|---|---|---|
| SVD-4113, 4128, 4143, 4158 | Sin clasificar | **Correcto por decisión cerrada** (23/09/2026) | "sin grabar", "pantalla en negro" |
| SVD-4110, 4125, 4140, 4155 | Equipo de campo averiado | **Ya cubierto** (corrida anterior de hoy) | "sin respuesta" |
| SVD-4111, 4126, 4141, 4156 | Pérdida de registro o evidencia | **Ya cubierto** (corrida anterior de hoy) | "corte de grabación" |
| Resto (44 tickets) | Coincide con `sugerencia.categoria` | Sin problema | varias |

### Divergencias de impacto/urgencia (no de categoría)

| id(s) | Qué pasa | ¿Alcance del corrector? |
|---|---|---|
| SVD-4107, 4122, 4137, 4152 ("Acceso temporal de proveedor") | `CLAVES_UNA_PERSONA` no captaba "un proveedor externo": el impacto salía de la zona (Alto en zona crítica) en vez del Bajo del dataset | **Sí** |
| SVD-4103, 4118, 4133, 4148 ("Doble fichaje") | "del mismo guardia" no estaba en `CLAVES_UNA_PERSONA` → impacto Medio en vez de Bajo | **Sí** |
| SVD-4109, 4124, 4139, 4154 ("Alarma nocturna sin causa aparente") | La regla fija urgencia `Baja`; el dataset usa `Media`. R8 admite las dos | **No** → decisión humana |

## 2. Corrección del corrector

**Archivo tocado (único):** `js/utils/clasificador-nuevo-ticket.js`, línea 22.
**Array tocado:** `CLAVES_UNA_PERSONA` (NO `REGLAS`).
**Palabras añadidas:** `"un proveedor externo"` y `"del mismo guardia"`.

```js
const CLAVES_UNA_PERSONA = ["su tarjeta", "su credencial", "un guardia nuevo", "un empleado", "a un guardia", "un proveedor externo", "del mismo guardia"];
```

**Regla que aplica:** R2 — el impacto baja a `Bajo` cuando el texto describe a una sola persona.
La categoría ya salía bien en los 8 tickets; solo fallaba el eje de impacto.

**Efecto:** SVD-4107 y SVD-4137 (zona crítica) Alto → **Bajo**; SVD-4122, 4152, 4103, 4118,
4133, 4148 Medio → **Bajo**. Los 8 coinciden ahora con el `impacto` del dataset.

**No se tocó:** `REGLAS`, el comentario de las líneas 8-10, `data/tickets.json`, los tests.
Sin commit ni push.

## 3. Veredicto del verificador

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Los 8 tickets señalados dan ya el impacto del dataset, sin cambio de categoría | **PASA** |
| 2 | Ningún otro ticket contiene las claves nuevas (52 restantes intactos) | **PASA** |
| 3 | Invariante «Brecha de seguridad activa nunca es impacto Bajo» (return temprano en `impactoDe()`) | **PASA** |
| 4 | SVD-4113/4128/4143/4158 siguen «Sin clasificar»; comentario 8-10 intacto | **PASA** |
| 5 | `REGLAS` sin cambios, con las claves de la corrida anterior | **PASA** (matiz: contenido verificado, no `git diff`) |
| 6 | No se tocó `tickets.json` ni otro archivo | **PASA** (matiz: snapshot de git status, no comando en vivo) |
| 7 | Comprobación ejecutable del cambio | **RIESGO** |
| 8 | Semántica de las claves nuevas | **RIESGO** |

**RIESGO 1 — sin cobertura de test.** `tests/unit/clasificador-nuevo-ticket.spec.js` tiene 8 casos;
ninguno usa las claves nuevas. El cambio no rompe nada, pero tampoco está cubierto: si alguien
"limpia" `CLAVES_UNA_PERSONA`, la suite sigue verde y las 8 sugerencias vuelven a salir mal en
silencio.

**RIESGO 2 — el heurístico infiere "una persona" de que el texto *nombre* a una persona.**
Sobre los 60 tickets actuales no hay falso positivo. Pero un ticket nuevo escrito a mano como
*"El lector que usa un proveedor externo no responde en Sala de servidores"* saldría Equipo de
campo averiado con impacto **Bajo** en zona crítica, cuando debería ser Alto. Límite heredado del
diseño de claves (ya lo tenían `un empleado` y `a un guardia`); las dos nuevas lo ensanchan.
Además `del mismo guardia` está muy pegada a la redacción del dataset.

**Ningún RIESGO se dio por bueno:** los dos pasan a decisiones pendientes.

## 4. Cronista

Redactó el informe completo (8 secciones, tono y estructura de `docs/triaje-auditoria-28-09.md`),
pero **NO pudo escribir el archivo**: la herramienta `Write` está deshabilitada en esta sesión,
también para subagentes. Devolvió el contenido en su respuesta.

- Ruta prevista y **no escrita**: `docs/triaje-auditoria-28-09-2.md`.
- `docs/triaje-auditoria-28-09.md` **intacto**, no se pisó.
- El orquestador **no** creó el archivo en su lugar: su único archivo de escritura es este
  `docs/contexto-triaje.md`. Queda como decisión pendiente.

## 5. Decisiones pendientes para una persona

1. **Cobertura de test del fix (RIESGO 1).** Decidir si se deja sin cobertura hasta la Fase 4 o
   se añade ya un caso en `npm run test:unit`: `clasificarTicketNuevo` con el texto de SVD-4137
   (zona crítica + "un proveedor externo") esperando `impacto: "Bajo"`. Es el caso que distingue
   el fix de no haberlo hecho.
2. **Criterio del eje de impacto para tickets nuevos (RIESGO 2).** Decidir si se acepta el
   heurístico tal cual (el operador revisa siempre antes de confirmar, principio 1) o si
   `CLAVES_UNA_PERSONA` debe ignorarse cuando la zona es crítica. Es criterio de equipo, como las
   tres zonas críticas de R2.
3. **Urgencia de «Falsa alarma recurrente»** (SVD-4109, 4124, 4139, 4154): la regla fija `Baja`,
   el dataset usa `Media`. R8 admite las dos. Falta decidir qué criterio manda.
4. **`npm test` no se ha ejecutado.** Ningún subagente de la cadena tiene permiso de ejecución;
   la suite de regresión sigue sin pasar sobre este cambio.
5. **Sin commit.** El cambio está en el working tree, sin commitear (por diseño de la cadena).
6. **El entregable del cronista no está en disco.** `Write` deshabilitado para subagentes en esta
   sesión. Hay que crear `docs/triaje-auditoria-28-09-2.md` con el contenido que devolvió, desde
   una sesión con `Write` habilitado.
