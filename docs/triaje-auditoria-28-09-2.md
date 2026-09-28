# Auditoría del clasificador con un equipo de agentes — 28/09/2026 (segunda corrida)

Registro de la **segunda** corrida del día de la cadena `auditor → corrector → verificador →
cronista`, esta vez coordinada por el subagente **orquestador**, que guardó el contexto entre pasos
en `docs/contexto-triaje.md`. La primera corrida está en `docs/triaje-auditoria-28-09.md`; este
documento no la sustituye, la continúa.

Qué se quería saber: **si el clasificador de reglas fijas coincide con la clasificación que ya
tiene el dataset**, ahora que la primera corrida cerró los huecos que había encontrado.

Alcance: el clasificador solo sugiere para **tickets nuevos creados en el navegador** (R10). Las
`sugerencia` de `data/tickets.json` las escribió Claude Code sobre el repo y no se tocan.

Lo que ya venía hecho y no se repitió: las claves `"sin respuesta"` y `"corte de grabación"` /
`"corte de grabacion"`, aplicadas en la primera corrida.

## 1. Qué hizo cada agente

| Agente | Herramientas | Resultado |
|---|---|---|
| **orquestador** | Agent, Read, Grep, Write (solo `docs/contexto-triaje.md`) | Repartió el trabajo y pasó el contexto entre pasos |
| **auditor** | Read, Grep (solo lectura) | **Cero hallazgos nuevos de categoría.** Señaló divergencias de impacto y una de urgencia |
| **corrector** | Read, Grep, Edit (el único que podía tocar código) | Dos palabras en `CLAVES_UNA_PERSONA` |
| **verificador** | Read, Grep (solo lectura) | 8 comprobaciones: **6 pasa, 2 riesgo** |
| **cronista** | Read, Write | Redactó este informe — **pero no pudo escribirlo** (ver más abajo) |

Ninguno hizo `git commit` ni `git push`, y ninguno puede ejecutar comandos.

## 2. Qué revisó el auditor

**Categoría: 0 hallazgos nuevos.** Los 56 tickets clasificables casan con una clave y coinciden con
la categoría del dataset. Ningún falso positivo por orden de reglas.

- **SVD-4113, 4128, 4143, 4158** («cámara sin grabar / pantalla en negro») siguen «Sin clasificar»
  **a propósito** — decisión cerrada del 23/09/2026 en `docs/categorias-triaje.md`, con su
  comentario en `REGLAS`. No es un fallo ni deuda: el corrector lo respetó y no tocó nada ahí.
- **SVD-4110, 4125, 4140, 4155** y **SVD-4111, 4126, 4141, 4156**: ya cubiertos por la primera corrida.

Lo que sí falló, en el eje del impacto:

| Tickets | Qué pasaba |
|---|---|
| SVD-4107, 4122, 4137, 4152 («Acceso temporal de proveedor») | «un proveedor externo» no se reconocía como una sola persona: el impacto salía de la zona (Alto en zona crítica) en vez del Bajo del dataset |
| SVD-4103, 4118, 4133, 4148 («Doble fichaje») | «del mismo guardia» tampoco se reconocía → Medio en vez de Bajo |
| SVD-4109, 4124, 4139, 4154 («Alarma nocturna sin causa aparente») | La regla fija urgencia Baja, el dataset usa Media. **Fuera del alcance del corrector**: es decisión humana |

## 3. Qué corrigió el corrector

Un archivo, una línea: `js/utils/clasificador-nuevo-ticket.js`, el array **`CLAVES_UNA_PERSONA`**.
**No tocó `REGLAS`.** Palabras añadidas: `"un proveedor externo"` y `"del mismo guardia"`.

Regla de fondo: **R2** — el impacto baja a `Bajo` cuando el texto describe a una sola persona. La
categoría ya salía bien en los 8 tickets; solo fallaba el impacto. SVD-4107 y SVD-4137 (zona
crítica) pasan de Alto a Bajo; SVD-4122, 4152, 4103, 4118, 4133 y 4148, de Medio a Bajo.

## 4. Qué confirmó el verificador

**Seis comprobaciones pasan:** los 8 tickets dan ya el impacto del dataset sin cambiar de
categoría; ningún otro ticket contiene las claves nuevas; se mantiene el invariante «una Brecha de
seguridad activa nunca es impacto Bajo»; los 4 tickets de cámara siguen «Sin clasificar» con su
comentario intacto; `REGLAS` sin cambios; no se tocó `tickets.json` ni ningún otro archivo.

**Dos riesgos, ninguno dado por bueno:**

1. **El cambio no tiene test.** `tests/unit/clasificador-nuevo-ticket.spec.js` no usa las claves
   nuevas. Si alguien «limpia» `CLAVES_UNA_PERSONA`, la suite sigue verde y las 8 sugerencias
   vuelven a salir mal en silencio.
2. **El heurístico es frágil.** Deduce «una persona» de que el texto *nombre* a una persona. Un
   ticket nuevo como *«El lector que usa un proveedor externo no responde en Sala de servidores»*
   saldría impacto **Bajo** en zona crítica, cuando debería ser Alto. El límite ya existía; las
   claves nuevas lo ensanchan, y `"del mismo guardia"` está muy pegada a la redacción del dataset.

## 5. Qué se revirtió

Nada. En esta corrida no hubo marcha atrás.

## 6. Qué quedó comprobado

- **`npm test`: 288 tests en verde**, ejecutados fuera de la cadena — ningún agente puede correr
  comandos.
- **Sin commit ni push**, por diseño. El cambio del corrector sigue en el working tree.
- **Archivos no tocados:** `data/tickets.json`, el array `REGLAS`, los tests y el resto del código.

## 7. Lo que sigue abierto

1. **Cobertura del cambio (riesgo 1).** ¿Se añade ya un test, o espera a la Fase 4? El caso que lo
   distingue: `clasificarTicketNuevo` con el texto de SVD-4137 (zona crítica + «un proveedor
   externo») esperando `impacto: "Bajo"`.
2. **Criterio del eje de impacto (riesgo 2).** ¿Se acepta el heurístico tal cual, apoyándose en que
   el operador siempre revisa antes de confirmar (principio 1), o `CLAVES_UNA_PERSONA` debe
   ignorarse cuando la zona es crítica? Es criterio de equipo, como las tres zonas críticas de R2.
3. **Urgencia de «Falsa alarma recurrente»** (SVD-4109, 4124, 4139, 4154): la regla fija `Baja`, el
   dataset usa `Media`. R8 admite las dos. ¿Cuál manda?
4. **El cambio del corrector sigue sin commitear.**

## 8. Lo que enseña esta corrida

Dos cosas, y la segunda no estaba prevista.

Una corrida puede terminar casi sin cambios y seguir siendo útil. El auditor no encontró ningún
error de categoría, y lo que parecía el hallazgo obvio —los 4 tickets de cámara— era una decisión ya
tomada y escrita, que esta vez el corrector respetó sin que nadie se lo recordara en el momento: se
lo dijo el comentario que quedó en `REGLAS`.

Y el cronista **no pudo escribir este informe**. La herramienta `Write` está denegada para los
subagentes en esa sesión, así que devolvió el texto y pidió que otro lo creara. El orquestador se
negó a hacerlo por él: si un agente al que se le niega un permiso consigue que otro ejecute la
acción, el permiso deja de servir para nada. El archivo lo escribió después una persona, a partir
del informe. Es la lección práctica de la corrida: **los permisos de un agente valen justo lo que
valga la negativa del agente de al lado**.
