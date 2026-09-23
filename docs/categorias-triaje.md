# Categorías de triaje — Mini Service Desk

Propuesta de clasificación para los 60 tickets de `data/tickets.json`.
Generado el 16/09/2026.

## Criterio

Cada categoría responde a **qué hay que hacer con el ticket**, no a qué sistema lo origina. El campo `sistema_afectado` ya existe en el dato y no sirve para triar: como se ve más abajo, un mismo sistema produce tickets que se atienden de formas completamente distintas.

Las categorías son excluyentes — cada ticket cae en una sola — y cubren el total sin dejar ninguno fuera.

## Las categorías

| Categoría | Definición | Tickets | Ejemplos |
|---|---|---|---|
| **Brecha de seguridad activa** | Un punto queda desprotegido ahora mismo: un permiso que debería estar revocado, una puerta sin vigilar o una alarma caída. | 12 | `SVD-4102` · `SVD-4108` |
| **Equipo de campo averiado** | Un dispositivo físico no responde, responde mal o no llega a funcionar. Hay que ir al sitio o sustituir hardware. | 12 | `SVD-4104` · `SVD-4110` |
| **Pérdida de registro o evidencia** | El sistema funciona, pero no guarda lo que debería o lo guarda mal. Compromete la trazabilidad, no la vigilancia. | 12 | `SVD-4103` · `SVD-4105` |
| **Fallo de integración entre sistemas** | Dos sistemas que deberían hablarse no se están hablando. No hay hardware roto: el fallo está en el enlace. | 8 | `SVD-4101` · `SVD-4112` |
| **Petición de acceso** | Alta o permiso nuevo que hay que conceder. No hay nada averiado: es trabajo planificable con fecha. | 8 | `SVD-4100` · `SVD-4107` |
| **Falsa alarma recurrente** | El sistema avisa de algo que no está pasando. No hay riesgo, hay ruido que desgasta al turno de guardia. | 4 | `SVD-4109` · `SVD-4124` |
| **Petición de información** | Solicitud de datos ya existentes (auditoría, histórico). No hay incidencia: hay que extraer y entregar. | 4 | `SVD-4106` · `SVD-4121` |

### Detalle de cada categoría

**Brecha de seguridad activa** (12 tickets)

Un punto queda desprotegido ahora mismo: un permiso que debería estar revocado, una puerta sin vigilar o una alarma caída.

- `SVD-4102` — Alarma perimetral desactivada tras mantenimiento en Perímetro exterior
- `SVD-4108` — Puerta de emergencia abierta sin alarma en Edificio B, planta 3

**Equipo de campo averiado** (12 tickets)

Un dispositivo físico no responde, responde mal o no llega a funcionar. Hay que ir al sitio o sustituir hardware.

- `SVD-4104` — Lector biométrico lento en Perímetro exterior
- `SVD-4110` — Lector de tarjetas sin respuesta en Perímetro exterior

**Pérdida de registro o evidencia** (12 tickets)

El sistema funciona, pero no guarda lo que debería o lo guarda mal. Compromete la trazabilidad, no la vigilancia.

- `SVD-4103` — Doble fichaje detectado en Oficinas centrales
- `SVD-4105` — Checkpoint 10 no registrado en ronda de Perímetro exterior

**Fallo de integración entre sistemas** (8 tickets)

Dos sistemas que deberían hablarse no se están hablando. No hay hardware roto: el fallo está en el enlace.

- `SVD-4101` — Cuadrante de Almacén Norte sin sincronizar
- `SVD-4112` — Interfono de Oficinas centrales no llega a centralita

**Petición de acceso** (8 tickets)

Alta o permiso nuevo que hay que conceder. No hay nada averiado: es trabajo planificable con fecha.

- `SVD-4100` — Guardia nuevo sin perfil de acceso en Acceso peatonal Este
- `SVD-4107` — Acceso temporal de proveedor a Sala de servidores

**Falsa alarma recurrente** (4 tickets)

El sistema avisa de algo que no está pasando. No hay riesgo, hay ruido que desgasta al turno de guardia.

- `SVD-4109` — Alarma nocturna sin causa aparente en Oficinas centrales
- `SVD-4124` — Alarma nocturna sin causa aparente en Aparcamiento -1

**Petición de información** (4 tickets)

Solicitud de datos ya existentes (auditoría, histórico). No hay incidencia: hay que extraer y entregar.

- `SVD-4106` — Solicitud de histórico de accesos en Perímetro exterior
- `SVD-4121` — Solicitud de histórico de accesos en Sala de servidores

## Por qué no basta con `sistema_afectado`

| Sistema | Tickets | Categorías de triaje que genera |
|---|---|---|
| Control de accesos | 16 | 3 — Brecha de seguridad activa; Equipo de campo averiado; Petición de acceso |
| SailPoint (identidades) | 12 | 3 — Brecha de seguridad activa; Petición de acceso; Petición de información |
| Centralita de guardia | 8 | 1 — Fallo de integración entre sistemas |
| Central de alarmas | 8 | 2 — Brecha de seguridad activa; Falsa alarma recurrente |
| App de rondas | 8 | 1 — Pérdida de registro o evidencia |
| CCTV / videovigilancia | 8 | 2 — Equipo de campo averiado; Pérdida de registro o evidencia |

Control de accesos y SailPoint, los dos sistemas con más volumen, reparten sus tickets entre tres categorías cada uno: desde una brecha de seguridad que hay que cerrar hoy hasta una petición planificable. Enrutar por sistema mezclaría esas dos cosas en la misma cola.

## Forma del dataset

Los 60 tickets no son 60 casos distintos: responden a **16 patrones de incidencia que se repiten**, la mayoría cuatro veces cada uno, cambiando solo la zona. Es un dataset sintético y limpio: no hay cola larga ni casos ambiguos de frontera. Al aplicar estas categorías a tickets reales habrá que prever una categoría de descarte para lo que no encaje.

## Nota tras la clasificación real (Fase 3, 23/09/2026)

Esta propuesta es del 16/09/2026, antes de que `docs/spec.md` definiera «Sin clasificar» (R1,
decisión 4). Al clasificar de verdad los 60 tickets, el patrón «Cámara N sin grabar en {zona}...
pantalla en negro» (`SVD-4113`, `SVD-4128`, `SVD-4143`, `SVD-4158`) pasó de **Equipo de campo
averiado** a **Sin clasificar**: el texto no permite decidir si es el equipo el que falla o si
solo ha dejado de guardar (R2, hechos observables), y ambas categorías encajan igual de bien.
Es el mismo ejemplo que usa `docs/wireframes-fase3/` para esa pantalla.

Reparto real en `data/tickets.json`: Equipo de campo averiado queda en **8** (no 12) y **Sin
clasificar** se queda con esos 4. El resto de categorías no cambia. Sigue sumando 60.

**Decisión cerrada (23/09/2026):** se quedan como «Sin clasificar». Reclasificarlas como Equipo de
campo averiado habría sido urgencia Alta (vigilancia que no graba ahora, R2), con `SVD-4113` en
Crítica, pero habría dejado la app sin ningún ticket que enseñe el flujo de «Sin clasificar».

## Verificación

- Tickets en el fichero: **60**
- Tickets clasificados: **60**
- Suma de las 7 categorías: **60**
- Tickets sin categoría: **0**
- Tickets en más de una categoría: **0**

**Resultado: cuadra** — la suma de las categorías coincide con el total del fichero.
