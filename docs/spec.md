# Spec — Fase 1 (Sesión 3): Triaje asistido del Mini Service Desk

Escrito el 22/09/2026 siguiendo Spec Driven Development. Cumple `docs/constitution.md`: si algo de
aquí choca con un principio, gana la constitución.

Revisado el 22/09/2026 tras `docs/revision-qa-spec.md`. Los 17 hallazgos de esa revisión están
resueltos y trazados en la tabla de decisiones.

Fuentes: `deep-research/deep-research-triaje-ia-seguridad-fisica.md`, `deep-research/deep-research-2a-pasada.md`,
`docs/categorias-triaje.md`, `docs/diseno.md` y `data/tickets.json`.

## Decisiones tomadas por preguntas

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Dónde se guarda la confirmación del operador, si no hay backend? | En el navegador mientras trabaja, más un botón «Exportar» que descarga el JSON con las confirmaciones para subirlo al repo. |
| 2 | ¿Qué niveles de urgencia hay? | Tres: Alta, Media, Baja. |
| 3 | ¿Qué niveles de impacto y cuántas prioridades? | Tres niveles de impacto por alcance. La matriz 3×3 da cuatro prioridades: Crítica, Alta, Media, Baja. |
| 4 | ¿Qué pasa si un ticket no encaja en ninguna categoría? | La IA marca «Sin clasificar» con su motivo y el ticket sale destacado para revisión manual. **Confirmado.** |
| 5 | ¿Qué tickets reciben sugerencia? | Los 60, abiertos y cerrados, para que el dataset quede completo. **Confirmado**, con el filtro por defecto corregido (ver decisión 9). |
| 6 | ¿Cuándo está terminado? | Ver «Criterios de finalización». **Confirmado.** |

### Decisiones añadidas al resolver la revisión QA

| # | Pregunta | Respuesta | Resuelve |
|---|---|---|---|
| 7 | ¿Cómo sabe la IA que un ticket afecta a varias zonas? | No puede: cada ticket tiene un solo campo `zona`. Se elimina «varias zonas» del impacto Alto y se sustituye por una **lista cerrada de zonas críticas** (R2). | A1 |
| 8 | ¿Cómo sabe la IA si «hay alternativa»? | No puede: el texto casi nunca lo dice. La urgencia se redefine sobre **hechos observables en el ticket** (R2). | A2 |
| 9 | ¿Cuál es el filtro por defecto de la bandeja? | «Pendientes de confirmar», **no** «abiertos». Si fuera «abiertos», los 10 tickets cerrados con sugerencia no aparecerían en ninguna vista donde alguien los confirme, y el criterio de finalización 1 los exige. | A5 + conflicto diseño↔spec |
| 10 | ¿Puede el operador cambiar la prioridad directamente? | No, y es intencionado: la prioridad siempre sale de la matriz (constitución, principio 5). Para cambiarla se corrige la urgencia o el impacto. | L5 |
| 11 | ¿Qué hace la app con una sugerencia incoherente? | La rechaza con un validador de coherencia (R8) y la trata como «Sin clasificar». | L2 |
| 12 | ¿Se puede comprobar que el motivo cita hechos del ticket? | Automáticamente no. Se comprueba longitud mínima y se revisan los 60 a mano; la limitación queda declarada (criterio de finalización 1). | A7 |

## Contexto

La bandeja tiene 60 incidencias sintéticas de seguridad física (`SVD-4100` a `SVD-4159`): 50
abiertas y 10 cerradas, de 6 sistemas y 12 zonas. Hoy ningún ticket tiene categoría ni
prioridad.

El operador de triaje no es técnico y trabaja con la bandeja todo el turno. Tiene que decidir
qué atender primero sin leer los 60 tickets uno por uno.

La IA es Claude Code trabajando sobre el repo, no el navegador. Escribe en el JSON una
sugerencia de categoría, urgencia e impacto, siempre con su motivo. La app la muestra, calcula
la prioridad con la matriz y deja que el operador la acepte o la corrija.

## Historias de usuario

1. **Como operador**, quiero ver cada ticket con la categoría y la prioridad sugeridas y el motivo al lado, para decidir sin abrir la ficha.
2. **Como operador**, quiero aceptar una sugerencia con un clic, para no perder tiempo en los casos claros.
3. **Como operador**, quiero corregir la categoría, la urgencia o el impacto, para que manden mi criterio y la matriz, no la IA.
4. **Como operador**, quiero ver primero los pendientes de confirmar y los «Sin clasificar», para no dejar nada sin revisar.
5. **Como operador**, quiero exportar lo que confirmé, para que quede guardado en el repo y lo vea el resto del equipo.
6. **Como operador**, quiero que me avise si cierro la pestaña con trabajo sin exportar, para no perderlo.
7. **Como responsable del servicio**, quiero saber cuántas sugerencias se aceptaron y cuántas se corrigieron, para saber si la IA ayuda.

## Requisitos

### R1. Sugerencia de la IA en el dato

Claude Code añade a cada ticket un objeto `sugerencia`, sin tocar los campos originales:

```json
"sugerencia": {
  "categoria": "Brecha de seguridad activa",
  "urgencia": "Alta",
  "impacto": "Alto",
  "motivo": "La alarma perimetral quedó desactivada tras un mantenimiento: el perímetro está sin vigilancia ahora."
}
```

- `categoria` es una de las 7 de `docs/categorias-triaje.md` o `"Sin clasificar"`.
- `urgencia` es `Alta`, `Media` o `Baja`. `impacto` es `Alto`, `Medio` o `Bajo`.
- **Si `categoria` es `"Sin clasificar"`, `urgencia` e `impacto` valen `null`.** Las cuatro claves
  existen siempre; solo esas dos admiten `null`, y solo en ese caso. *(A3)*
- `motivo` **nunca** está vacío, ni siquiera en «Sin clasificar»: ahí explica por qué no se pudo
  clasificar.
- La sugerencia no lleva prioridad: la calcula la app (R3).

### R2. Definición de urgencia e impacto

Ambas se deciden **solo con lo que el ticket dice**. Si para asignar un nivel hiciera falta
suponer algo que el texto no contiene, la categoría es «Sin clasificar». *(A1, A2)*

| Urgencia | Cuándo | Señal observable en el ticket |
|---|---|---|
| Alta | Algo queda **desprotegido o sin control ahora mismo** | Alarma caída o desactivada, puerta abierta o sin vigilar, permiso que debería estar revocado, vigilancia que no está grabando |
| Media | Hay un **fallo que degrada el servicio**, pero el ticket no describe ningún punto desprotegido | Equipo averiado, integración caída, registro incompleto o duplicado, alarma que salta sin causa |
| Baja | **No hay fallo**: es trabajo planificable | Alta o permiso nuevo, solicitud de datos ya existentes |

| Impacto | Cuándo |
|---|---|
| Alto | La `zona` del ticket es una de las tres **zonas críticas**: `Perímetro exterior`, `Sala de servidores`, `Torre de control` |
| Medio | Cualquier otra de las 12 zonas |
| Bajo | El ticket afecta **a una sola persona** (su credencial, su fichaje, su alta), sea cual sea la zona — **salvo que la categoría sea «Brecha de seguridad activa»** |

El nivel Bajo manda sobre la zona: un alta de acceso de un guardia en Sala de servidores es
impacto Bajo, no Alto, porque afecta a una persona y no a la protección de la zona.

**Excepción: las brechas nunca son impacto Bajo.** Si la categoría es «Brecha de seguridad
activa», el impacto sale siempre de la zona. Un permiso sin revocar expone **la zona**, no a la
persona que conserva el permiso: quien queda desprotegido es todo lo que hay detrás de esa
puerta. Como una brecha es siempre urgencia Alta (R8), esto deja las brechas en prioridad
Crítica (zona crítica) o Alta (resto), nunca Media. *(punto 16 de la 2ª revisión)*

> **Las tres zonas críticas son una decisión del equipo, no un dato del dominio.** Salen de que
> `Perímetro exterior` es la primera línea de defensa, `Sala de servidores` concentra el activo
> crítico y `Torre de control` es el puesto de mando. Cubren 21 de los 60 tickets. Si el criterio
> cambia, se edita esta tabla y se reclasifica.

### R3. Matriz de prioridad

| Urgencia \ Impacto | Alto | Medio | Bajo |
|---|---|---|---|
| **Alta** | Crítica | Alta | Media |
| **Media** | Alta | Media | Baja |
| **Baja** | Media | Baja | Baja |

- La prioridad la calcula una función pura en `js/utils/` a partir de la urgencia y el impacto.
- **La prioridad no se guarda en ningún sitio y no se puede editar directamente.** Para cambiarla,
  el operador corrige la urgencia o el impacto y la matriz la recalcula. Es intencionado:
  constitución, principio 5. *(L5)*
- Un ticket «Sin clasificar» no tiene prioridad hasta que el operador lo clasifica.

### R4. Bandeja

- Cada fila muestra: id, título, categoría, prioridad, motivo (visible sin desplegar) y estado del triaje.
- El estado del triaje es uno de estos tres: `Pendiente de confirmar`, `Confirmado` o `Corregido`.
- **«Sin clasificar» no es un estado del triaje: es un valor de `categoria`.** Son dos ejes
  independientes. Un ticket «Sin clasificar» nace en `Pendiente de confirmar` y **sí cuenta** en
  «Pendientes de confirmar»; cuando el operador le pone categoría pasa a `Corregido`. La única
  combinación imposible es «Sin clasificar» + `Confirmado`: aceptar una sugerencia que no
  clasifica nada no significa nada, así que en un «Sin clasificar» el botón «Aceptar» no
  aparece. *(punto 2 de la 2ª revisión)*
- **Mientras el estado sea `Pendiente de confirmar`, la categoría y la prioridad se pintan como
  sugeridas**: atenuadas y con la marca «sugerido» al lado. Confirmado y Corregido se pintan en
  sólido. En ningún momento una sugerencia sin confirmar se ve igual que una decidida por una
  persona (constitución, principio 1). *(C2)*
- **Filtro por defecto: «Pendientes de confirmar», independientemente del estado del ticket.** Los
  10 cerrados también aparecen aquí hasta que alguien los confirma. *(A5, decisión 9)*
- Orden por defecto: primero los «Sin clasificar», después el resto por prioridad (Crítica → Baja), y al final los confirmados.
- Se mantienen los filtros de `docs/diseno.md` (estado, sistema, zona) y se añaden filtros por prioridad y por estado del triaje.

### R5. Confirmar y corregir

- «Aceptar» guarda la sugerencia tal cual, con estado `Confirmado`.
- «Corregir» deja cambiar la categoría, la urgencia y el impacto con desplegables. La prioridad se recalcula al momento con la matriz.
- **Cuenta como `Corregido` si el operador cambia al menos uno de los tres campos.** Clasificar a
  mano un «Sin clasificar» cuenta como corregido. *(A4)*
- Nunca hay un «aceptar todo». Cada ticket se confirma de uno en uno (constitución, principio 1).
- La confirmación guarda el valor final, si fue aceptada o corregida, y la fecha y hora.

### R6. Persistencia y exportación

- Dos claves en `localStorage`, con responsabilidades separadas: *(hueco spec↔diseño)*
  - `svd-triaje` — las confirmaciones del operador.
  - `svd-tema` — la preferencia claro/oscuro del interruptor de `docs/diseno.md`.
- Si `localStorage` no está disponible, la app funciona igual y avisa de que hay que exportar antes de cerrar.
- **Si hay confirmaciones sin exportar, la app avisa antes de cerrar la pestaña.** *(L4)*
- «Exportar» descarga `tickets-triaje-AAAA-MM-DD.json`: los 60 tickets con sus campos originales, su `sugerencia` y un objeto `triaje` con lo confirmado.
- **La app guarda la hora del último export. Si después hay cambios, la cabecera muestra
  «hay cambios sin exportar».** *(L3)*
- Nunca se sobrescribe `data/tickets.json` desde el navegador.
- **Cómo vuelve el export al repo:** una persona del equipo sustituye `data/tickets.json` por el
  archivo descargado y comprueba que sigue teniendo 60 tickets del `SVD-4100` al `SVD-4159` con
  sus campos originales intactos. Añadir `sugerencia` y `triaje` es añadir campos, no reescribir
  tickets: no choca con `CLAUDE.md`. *(A6)*

### R7. Métricas

El panel de métricas (solo lectura) muestra:

- Tickets por prioridad y por categoría.
- Pendientes de confirmar.
- **Tasa de corrección** = `Corregido` / (`Confirmado` + `Corregido`). Es la medida de si la IA
  acierta, y solo cuenta tickets ya revisados. Se muestra también desglosada por categoría: una
  tasa global baja puede esconder una categoría que falla casi siempre. *(A4)*

### R8. Validación de coherencia de la sugerencia

Antes de mostrar una sugerencia, la app comprueba que la combinación categoría × urgencia sea
posible. Si no lo es, el ticket se trata como «Sin clasificar» y se avisa en la fila. *(L2)*

| Categoría | Urgencia obligatoria | Por qué |
|---|---|---|
| Brecha de seguridad activa | Alta | Por definición hay un punto desprotegido ahora |
| Petición de acceso | Baja | No hay nada averiado: es trabajo planificable |
| Petición de información | Baja | No hay incidencia: hay que extraer y entregar |
| Falsa alarma recurrente | **No puede ser Alta** | Por definición no hay riesgo, hay ruido |
| Equipo de campo averiado | libre | Puede dejar un punto sin cubrir o no |
| Pérdida de registro o evidencia | libre | Compromete trazabilidad, no siempre vigilancia |
| Fallo de integración entre sistemas | libre | Depende de qué enlace se haya caído |

Esta es la segunda capa de validación: la primera comprueba que los valores existan en su enum,
esta comprueba que la combinación tenga sentido. Un JSON válido puede contener una clasificación
imposible.

**La tabla vale igual para las correcciones del operador**, pero se aplica de otra forma: en vez
de rechazar, la interfaz **no ofrece la combinación imposible**. Al elegir una categoría con
urgencia obligatoria, el desplegable de urgencia queda fijado en ese valor y explica por qué; con
«Falsa alarma recurrente», `Alta` no aparece entre las opciones. No se bloquea a la persona: se
le quita una opción que no existe. Si discrepa, cambia la categoría. *(punto 8 de la 2ª revisión)*

Esto no choca con el principio 1: el operador sigue decidiendo qué categoría tiene el ticket, que
es la decisión de fondo. Lo que la interfaz impide es describir un ticket de forma contradictoria
consigo misma.

## Casos límite

| Caso | Qué pasa |
|---|---|
| La sugerencia trae una categoría que no está entre las 7 | Se trata como «Sin clasificar» y se avisa en la fila. |
| La sugerencia trae el motivo vacío | No se muestra la sugerencia; el ticket queda como «Sin clasificar» (constitución, principio 4). |
| La sugerencia es incoherente (categoría × urgencia imposible) | Se trata como «Sin clasificar» y se avisa, según R8. |
| «Sin clasificar» con urgencia o impacto distintos de `null` | Se ignoran esos dos valores; el ticket no tiene prioridad hasta que el operador lo clasifica. |
| El ticket no trae el campo `sugerencia` | Aparece como «Sin clasificar», no como error. |
| El operador corrige y luego quiere volver a la sugerencia | Hay un botón «Deshacer» que devuelve el ticket a `Pendiente de confirmar`. |
| El operador deshace después de exportar | La cabecera pasa a «hay cambios sin exportar». El archivo ya descargado no se toca. |
| Se cierra la pestaña con confirmaciones sin exportar | La app avisa antes de salir. |
| Se borra el `localStorage` sin haber exportado | El trabajo se pierde. El aviso anterior es la única defensa: está asumido y declarado. |
| El JSON cambia de versión y hay confirmaciones guardadas | Las confirmaciones se asocian por `id`. Las de ids que ya no existen se descartan. |
| Ticket cerrado | Se muestra con su sugerencia y **sí** cuenta en «Pendientes de confirmar» hasta que alguien lo confirma. |
| El texto del ticket trae HTML o caracteres raros | Se pinta con `textContent`, nunca con `innerHTML`. |

## Fuera de alcance

- Cualquier acción real: bloquear credenciales, avisar a guardias o escalar alarmas (constitución, principio 2).
- Login, usuarios, roles y permisos.
- Alta de tickets nuevos y edición del texto de un ticket.
- Clasificación en el navegador o con una API de IA. La sugerencia la escribe Claude Code en el repo.
- SLA y tiempos objetivo de respuesta.
- Detección de duplicados y resumen automático: con 60 tickets se revisan a mano.
- **Trabajo simultáneo de varios operadores.** Se asume un operador por vez. Si dos exportan
  archivos distintos, no hay regla automática que los una: se decide a mano cuál vale. *(L1)*

## Criterios de finalización

La Fase 3 está terminada cuando se cumplen todos:

1. Los 60 tickets tienen `sugerencia` con las cuatro claves, ningún `motivo` vacío y ninguno de
   menos de 40 caracteres. Se comprueba con un script. **Que el motivo cite hechos reales del
   ticket no es comprobable automáticamente**: se revisan los 60 a mano una vez, y queda
   declarado como límite de la comprobación. *(A7)*
2. La prioridad de cualquier ticket coincide con la matriz de R3. Se comprueban las 9 combinaciones.
3. Ninguna sugerencia incumple la tabla de coherencia de R8.
4. Se puede aceptar, corregir y deshacer un ticket, y el cambio sobrevive a recargar la página.
5. «Exportar» descarga un JSON válido con 60 tickets y los campos originales intactos.
6. Sin sugerencia válida, un ticket sale como «Sin clasificar» y no rompe la bandeja.
7. Los 10 tickets cerrados aparecen en «Pendientes de confirmar» hasta que se confirman.
8. `index.html` y `css/styles.css` no cargan ninguna URL externa, y la app funciona sin conexión.
9. Se cumplen los 6 principios de `docs/constitution.md`, cada uno con su comprobación.
