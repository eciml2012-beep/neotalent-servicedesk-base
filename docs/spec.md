# Spec — Fase 1 (Sesión 3): Triaje asistido del Mini Service Desk

Escrito el 22/09/2026 siguiendo Spec Driven Development. Cumple `docs/constitution.md`: si algo de
aquí choca con un principio, gana la constitución.

Fuentes: `deep-research/deep-research-triaje-ia-seguridad-fisica.md`, `deep-research/deep-research-2a-pasada.md`,
`docs/categorias-triaje.md`, `docs/diseno.md` y `data/tickets.json`.

## Decisiones tomadas por preguntas

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Dónde se guarda la confirmación del operador, si no hay backend? | En el navegador mientras trabaja, más un botón «Exportar» que descarga el JSON con las confirmaciones para subirlo al repo. |
| 2 | ¿Qué niveles de urgencia hay? | Tres: Alta, Media, Baja. |
| 3 | ¿Qué niveles de impacto y cuántas prioridades? | Tres niveles de impacto por alcance. La matriz 3×3 da cuatro prioridades: Crítica, Alta, Media, Baja. |
| 4 | ¿Qué pasa si un ticket no encaja en ninguna categoría? | *Sin respuesta en la sesión; se aplica la opción por defecto:* la IA marca «Sin clasificar» con su motivo y el ticket sale destacado para revisión manual. **Pendiente de validar en grupo.** |
| 5 | ¿Qué tickets reciben sugerencia? | *Opción por defecto:* los 60, abiertos y cerrados, para que el dataset quede completo. **Pendiente de validar.** |
| 6 | ¿Cuándo está terminado? | Ver «Criterios de finalización». **Pendiente de validar.** |

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
6. **Como responsable del servicio**, quiero saber cuántas sugerencias se aceptaron y cuántas se corrigieron, para saber si la IA ayuda.

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
- `motivo` nunca está vacío y cita hechos del propio ticket.
- La sugerencia no lleva prioridad: la calcula la app (R3).

### R2. Definición de urgencia e impacto

| Urgencia | Cuándo |
|---|---|
| Alta | El riesgo está ocurriendo ahora: un punto desprotegido, una alarma caída o un permiso que debería estar revocado. |
| Media | El servicio está afectado pero hay alternativa (otro lector, ronda manual, guardia en el punto). |
| Baja | Trabajo planificable o petición de información. |

| Impacto | Cuándo |
|---|---|
| Alto | Afecta a una zona crítica (Perímetro exterior, Sala de servidores, Torre de control) o a varias zonas. |
| Medio | Afecta a un punto concreto de una zona no crítica. |
| Bajo | Afecta a una sola persona o es un trámite. |

### R3. Matriz de prioridad

| Urgencia \ Impacto | Alto | Medio | Bajo |
|---|---|---|---|
| **Alta** | Crítica | Alta | Media |
| **Media** | Alta | Media | Baja |
| **Baja** | Media | Baja | Baja |

- La prioridad la calcula una función pura en `js/utils/` a partir de la urgencia y el impacto.
- Un ticket «Sin clasificar» no tiene prioridad hasta que el operador lo clasifica.

### R4. Bandeja

- Cada fila muestra: id, título, categoría, prioridad, motivo (visible sin desplegar) y estado del triaje.
- El estado del triaje es uno de estos tres: `Pendiente de confirmar`, `Confirmado` o `Corregido`.
- Orden por defecto: primero los «Sin clasificar», después los pendientes por prioridad (Crítica → Baja), y al final los confirmados.
- Se mantienen los filtros de `docs/diseno.md` (estado, sistema, zona) y se añaden filtros por prioridad y por estado del triaje.

### R5. Confirmar y corregir

- «Aceptar» guarda la sugerencia tal cual como confirmada.
- «Corregir» deja cambiar la categoría, la urgencia y el impacto con desplegables. La prioridad se recalcula al momento con la matriz.
- Nunca hay un «aceptar todo». Cada ticket se confirma de uno en uno (constitución, principio 1).
- La confirmación guarda el valor final, si fue aceptada o corregida, y la fecha y hora.

### R6. Persistencia y exportación

- Las confirmaciones se guardan en `localStorage` del navegador, con la clave `svd-triaje`.
- Si `localStorage` no está disponible, la app funciona igual y avisa de que hay que exportar antes de cerrar.
- «Exportar» descarga `tickets-triaje-AAAA-MM-DD.json`: los 60 tickets con sus campos originales, su `sugerencia` y un objeto `triaje` con lo confirmado.
- Nunca se sobrescribe `data/tickets.json` desde el navegador.

### R7. Métricas

El panel de métricas (solo lectura) muestra:

- Tickets por prioridad y por categoría.
- Pendientes de confirmar.
- Tasa de corrección: corregidos / (aceptados + corregidos). Es la medida de si la IA acierta.

## Casos límite

| Caso | Qué pasa |
|---|---|
| La sugerencia trae una categoría que no está entre las 7 | Se trata como «Sin clasificar» y se avisa en la fila. |
| La sugerencia trae el motivo vacío | No se muestra la sugerencia; el ticket queda como «Sin clasificar» (constitución, principio 4). |
| El ticket no trae el campo `sugerencia` | Aparece como «Sin clasificar», no como error. |
| El operador corrige y luego quiere volver a la sugerencia | Hay un botón «Deshacer» que devuelve el ticket a `Pendiente de confirmar`. |
| El JSON cambia de versión y hay confirmaciones guardadas | Las confirmaciones se asocian por `id`. Las de ids que ya no existen se descartan. |
| Ticket cerrado | Se muestra con su sugerencia pero no cuenta en «Pendientes de confirmar». |
| El texto del ticket trae HTML o caracteres raros | Se pinta con `textContent`, nunca con `innerHTML`. |

## Fuera de alcance

- Cualquier acción real: bloquear credenciales, avisar a guardias o escalar alarmas (constitución, principio 2).
- Login, usuarios, roles y permisos.
- Alta de tickets nuevos y edición del texto de un ticket.
- Clasificación en el navegador o con una API de IA. La sugerencia la escribe Claude Code en el repo.
- SLA y tiempos objetivo de respuesta.
- Detección de duplicados y resumen automático: con 60 tickets se revisan a mano.
- Sincronización entre operadores en tiempo real. Se comparte exportando y subiendo al repo.

## Criterios de finalización

La Fase 3 está terminada cuando se cumplen todos:

1. Los 60 tickets tienen `sugerencia` con los cuatro campos, y ningún `motivo` está vacío. Se comprueba con un script.
2. La prioridad de cualquier ticket coincide con la matriz de R3. Se comprueban las 9 combinaciones.
3. Se puede aceptar, corregir y deshacer un ticket, y el cambio sobrevive a recargar la página.
4. «Exportar» descarga un JSON válido con 60 tickets y los campos originales intactos.
5. Sin sugerencia válida, un ticket sale como «Sin clasificar» y no rompe la bandeja.
6. Se cumplen los 6 principios de `docs/constitution.md`, cada uno con su comprobación.
