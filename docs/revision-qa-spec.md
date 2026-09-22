# Revisión QA del spec — Paso 5 de la práctica

Revisión de `docs/spec.md` contra `docs/constitution.md`, hecha el 22/09/2026.
La revisión original **solo detectaba**, sin proponer soluciones.

**Resuelta el 22/09/2026.** Los 17 hallazgos originales más 3 añadidos al revisar el repo entero
están cerrados. Cada fila dice dónde quedó la decisión. Este documento se conserva como registro:
lo que se detectó, y qué se decidió.

## Conflictos con la constitución (4 · todos resueltos)

| # | Qué chocaba | Resolución | Dónde |
|---|---|---|---|
| C1 | IBM Plex desde Google Fonts sería dependencia externa (principio 6), y la comprobación del principio solo hablaba de scripts | Se usa la **pila de fuentes del sistema**, no se descarga ninguna. El principio 6 ahora nombra las fuentes y prohíbe cualquier URL externa en HTML y CSS | `constitution.md` §6 · `diseno.md`, reglas visuales |
| C2 | La bandeja mostraba categoría y prioridad antes de confirmar, sin distinguir lo sugerido de lo confirmado (principio 1) | Mientras esté `Pendiente de confirmar`, categoría y prioridad van **atenuadas, con borde punteado y la marca «sugerido»**. Al confirmar pasan a sólido | `spec.md` R4 · `diseno.md`, reglas visuales |
| C3 | El principio 2 prohíbe acciones fuera de la bandeja, y descargar un archivo lo es | El principio 2 prohíbe acciones **sobre personas o instalaciones**. Manejar los propios datos del triaje (descargar, guardar en el navegador) está permitido y así queda escrito | `constitution.md` §2 |
| C4 | «Se revisa antes del commit» no decía quién ni cómo | El dataset está **cerrado en 60 tickets, `SVD-4100`–`SVD-4159`**. No se añaden tickets nuevos, así que la comprobación pasa a ser automática: si cambia el número o el rango de ids, el commit no pasa | `constitution.md` §3 |

## Ambigüedades (8 · todas resueltas)

| # | Qué no estaba claro | Resolución | Dónde |
|---|---|---|---|
| A1 | El impacto Alto hablaba de «varias zonas», pero cada ticket tiene un solo campo `zona` | Se elimina «varias zonas». El impacto Alto se define por una **lista cerrada de 3 zonas críticas**: Perímetro exterior, Sala de servidores, Torre de control (21 de 60 tickets) | `spec.md` R2, decisión 7 |
| A2 | La urgencia Media exigía saber «si hay alternativa», que el texto casi nunca dice | La urgencia se redefine sobre **hechos observables en el ticket**: si hiciera falta suponer algo que el texto no contiene, la categoría es «Sin clasificar» | `spec.md` R2, decisión 8 |
| A3 | No estaba dicho si un «Sin clasificar» lleva urgencia e impacto | Las cuatro claves existen siempre; con «Sin clasificar», `urgencia` e `impacto` valen **`null`** y no hay prioridad. `motivo` sigue siendo obligatorio: explica por qué no se pudo clasificar | `spec.md` R1 |
| A4 | No estaba definido qué cuenta como «Corregido» en la tasa | Cuenta como corregido si el operador **cambia al menos uno de los tres campos**. Clasificar a mano un «Sin clasificar» también cuenta. La tasa se muestra además desglosada por categoría | `spec.md` R5, R7 |
| A5 | Los cerrados no contaban como pendientes, así que su estado de triaje sería «Pendiente» para siempre | Los 10 cerrados **sí cuentan** en «Pendientes de confirmar» hasta que alguien los confirma, y el filtro por defecto de la bandeja pasa a ser ese | `spec.md` R4, decisión 9 |
| A6 | No estaba dicho quién sube el export a `data/tickets.json` | Una persona del equipo sustituye el archivo a mano y comprueba los 60 ids y los campos originales. Añadir `sugerencia` y `triaje` es **añadir campos, no reescribir tickets**: no choca con `CLAUDE.md` | `spec.md` R6 |
| A7 | Nadie puede comprobar automáticamente que el motivo cite hechos del ticket | Se comprueba lo comprobable —no vacío y **mínimo 40 caracteres**— y se revisan los 60 a mano una vez. **La limitación queda declarada**, no disimulada | `spec.md`, criterio 1 · decisión 12 |
| A8 | Las decisiones 4, 5 y 6 se tomaron por defecto, sin debate | Confirmadas el 22/09/2026. La 5 se confirma **con el filtro por defecto corregido** (ver A5) | `spec.md`, tabla de decisiones |

## Casos límite (5 · todos resueltos)

| # | Caso | Resolución | Dónde |
|---|---|---|---|
| L1 | Dos operadores exportan archivos distintos | **Fuera de alcance**: se asume un operador por vez. Si pasa, se decide a mano cuál vale. Declarado, no resuelto por código | `spec.md`, fuera de alcance |
| L2 | Sugerencia incoherente: «Brecha de seguridad activa» con urgencia Baja | **Validador de coherencia** (R8): tabla de combinaciones categoría × urgencia imposibles. Lo que la incumple se trata como «Sin clasificar» y se avisa | `spec.md` R8, decisión 11 |
| L3 | Deshacer después de exportar deja el archivo desactualizado sin aviso | La app guarda la hora del último export; si después hay cambios, la cabecera muestra **«hay cambios sin exportar»** | `spec.md` R6 |
| L4 | Se borra el `localStorage` antes de exportar | **Aviso al cerrar la pestaña** si hay confirmaciones sin exportar. Si aun así se borra, el trabajo se pierde: asumido y declarado | `spec.md` R6, casos límite |
| L5 | El operador discrepa de la prioridad pero solo puede tocar urgencia e impacto | **Es intencionado** y ahora está escrito: la prioridad siempre sale de la matriz (principio 5). Para cambiarla se corrige urgencia o impacto | `spec.md` R3, decisión 10 |

## Añadidos al revisar el repo entero (3 · resueltos)

La revisión original solo cruzó **spec ↔ constitución**. Estos salieron de cruzar además
**spec ↔ diseño** y de mirar el repo completo.

| # | Qué chocaba | Resolución | Dónde |
|---|---|---|---|
| X1 | `diseno.md` abría la bandeja con las 50 abiertas; el spec da sugerencia a los 60 y el criterio 1 los exige. Los 10 cerrados no tenían vista donde confirmarse | El filtro por defecto pasa a «Pendientes de confirmar», sin filtrar por estado del ticket. Corregido en los dos documentos a la vez | `spec.md` R4 · `diseno.md`, flujo |
| X2 | El interruptor claro/oscuro guarda preferencia, pero el spec solo definía la clave `svd-triaje` | Dos claves separadas: `svd-triaje` para confirmaciones, `svd-tema` para el tema | `spec.md` R6 · `diseno.md` |
| X3 | `diseno.md` decía «ver las 12» hablando de categorías, cuando hay **7** (12 son las zonas) | Corregido: «solo caben 3 de las 7 categorías» | `diseno.md`, tabla de opciones |

## Lo que sigue abierto

Nada de esta revisión. Lo único pendiente del proyecto es de otra naturaleza:

- Las **tres zonas críticas** de R2 son una decisión del equipo, no un dato del dominio. Están
  documentadas como tal y son editables; si el criterio cambia, se reclasifica.
- Las capturas de `assets/referencias/` todavía no están todas guardadas.
