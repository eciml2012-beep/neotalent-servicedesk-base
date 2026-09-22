# Revisión QA del spec — segunda pasada

22/09/2026. Se hizo sobre `docs/spec.md` después de resolver la primera revisión (commit `0e22339`), cruzándolo con `docs/constitution.md` y `docs/diseno.md`.
Solo detecta: no propone soluciones.

> **Estado: 7 de 20 resueltos** (22/09/2026). Cerrados los tres bloqueantes (2, 8, 16), los tres
> conflictos con la constitución (17, 18, 19) y el 15, que era una errata de conteo. Cada uno
> lleva debajo su resolución y el archivo donde quedó. El resto sigue abierto y pasa a la Fase 3,
> tal como decía el veredicto.

## Ambigüedades

1. **Impacto «una sola persona» (R2).** No se dice cómo decide la IA que un ticket afecta a una sola persona. Por ejemplo, ¿un doble fichaje es de una persona o de la zona? Es un juicio, no un hecho observable, y R2 exige hechos observables.
2. **«Sin clasificar» no es un estado del triaje (R4).** Los estados son tres: Pendiente, Confirmado y Corregido. No está dicho en qué estado queda un «Sin clasificar», ni si cuenta dentro de «Pendientes de confirmar».
   - ✅ **RESUELTO** → `spec.md` R4. Son **dos ejes independientes**: «Sin clasificar» es un valor de `categoria`, no un estado del triaje. Un «Sin clasificar» nace en `Pendiente de confirmar` y **sí cuenta** en «Pendientes de confirmar»; al clasificarlo el operador pasa a `Corregido`. La única combinación imposible es «Sin clasificar» + `Confirmado`, así que ahí el botón «Aceptar» no aparece.
3. **Orden de la bandeja (R4).** Dice «al final los confirmados», pero el filtro por defecto («Pendientes de confirmar») no los muestra. No está claro en qué vista se aplica ese orden.
4. **Corregir sin cambiar nada (R5).** Si el operador abre «Corregir» y guarda sin tocar ningún campo, no está dicho si queda como Confirmado o como Corregido.
5. **Qué deshace «Deshacer».** Solo se describe deshacer después de corregir. No se dice si también deshace un «Aceptar».
6. **Solapamiento de señales (R2 y categorías).** «Vigilancia que no está grabando» es una señal de urgencia Alta, pero ese caso encaja también en «Pérdida de registro o evidencia», cuya urgencia es libre. El mismo ticket puede recibir dos lecturas distintas.
7. **Qué se exporta de los pendientes (R6).** No se dice si los tickets pendientes llevan un objeto `triaje` vacío, `null` o ninguno.

## Casos límite no cubiertos

8. **Correcciones incoherentes del operador.** R8 valida solo la sugerencia de la IA. Nada impide que el operador corrija a «Brecha de seguridad activa» con urgencia Baja.
   - ✅ **RESUELTO** → `spec.md` R8. La tabla vale igual para el operador, pero se aplica **en la interfaz, no rechazando**: al elegir una categoría con urgencia obligatoria, el desplegable de urgencia queda fijado en ese valor y explica por qué; con «Falsa alarma recurrente», `Alta` no aparece. No se bloquea a la persona, se le quita una opción que no existe. Si discrepa, cambia la categoría. No choca con el principio 1: la decisión de fondo —qué categoría tiene el ticket— sigue siendo suya.
9. **Impacto que no cuadra con la zona.** No hay ninguna validación de que el impacto sugerido coincida con la regla de zonas de R2, por ejemplo un impacto Alto en una zona no crítica. R8 solo cruza categoría y urgencia.
10. **Misma id con una sugerencia nueva.** Si Claude Code regenera la sugerencia de un ticket que ya estaba confirmado, la confirmación de `localStorage` se aplica sobre una sugerencia distinta de la que se confirmó.
11. **El export vuelve al repo y ya trae `triaje`.** No está definido qué manda cuando `data/tickets.json` trae confirmaciones y el `localStorage` tiene otras.
12. **Dos pestañas abiertas en el mismo navegador.** Comparten `svd-triaje` y pueden pisarse las confirmaciones.
13. **Corregir a «Sin clasificar».** No se dice si el operador puede elegir «Sin clasificar» como corrección, ni qué pasa en ese caso con la urgencia y el impacto.

## Contradicciones internas

14. **Mínimo de 40 caracteres.** Solo aparece en el criterio de finalización 1. R1 no lo exige, y los casos límite solo tratan el motivo vacío.
15. **Número de hallazgos.** La cabecera del spec habla de «los 17 hallazgos» y el commit `0e22339` de «los 20 hallazgos».
    - ✅ **RESUELTO** → `spec.md`, cabecera. Son **20**: los 17 de la revisión original más 3 que salieron de cruzar spec con diseño. La cabecera lo dice ya, y añade la segunda revisión. Donde sigue apareciendo «17» es correcto: son las frases del tipo «los 17 originales más 3».
16. **Brecha activa con prioridad Media.** Una brecha es siempre urgencia Alta (R8). Si afecta a una persona («permiso que debería estar revocado»), el impacto es Bajo y la matriz da prioridad **Media**. Choca con la intención del diseño, donde el rojo se reserva para las brechas, y con la historia 4 (atender primero lo crítico).
   - ✅ **RESUELTO** → `spec.md` R2, decidido en grupo el 22/09/2026 entre tres opciones. **Una brecha nunca es impacto Bajo**: si la categoría es «Brecha de seguridad activa», el impacto sale siempre de la zona. El razonamiento: un permiso sin revocar expone **la zona**, no a la persona que conserva el permiso — quien queda desprotegido es todo lo que hay detrás de esa puerta. Las brechas quedan en Crítica (zona crítica) o Alta (resto), nunca Media.
   - Se descartaron: un **suelo de prioridad por categoría** (añadía un segundo mecanismo encima de la matriz y rozaba el principio 5) y **dejarlo como está** moviendo el rojo a la etiqueta de categoría.

## Conflictos con la constitución

17. **Principio 1.** Dice «hasta que el operador acepta o corrige la sugerencia de categoría y prioridad». Según R1, la IA no sugiere prioridad: sugiere urgencia e impacto.
    - ✅ **RESUELTO** → `constitution.md` §1. Ahora dice «**categoría, urgencia e impacto**», y añade que la prioridad no se sugiere ni se confirma: sale de la matriz a partir de lo ya confirmado (principio 5).
18. **Principio 2.** Su comprobación exige «ninguna llamada de red de salida», pero la app hace `fetch("data/tickets.json")`. Es una lectura local; la redacción no distingue entre local y externo.
    - ✅ **RESUELTO** → `constitution.md` §2. La comprobación pasa a ser «**ninguna petición a un host externo**», y nombra explícitamente el `fetch` del dataset como lectura del mismo origen que no sale a ninguna parte.
19. **Principio 3.** Su comprobación dice «si el número de tickets o el rango cambia, el commit no pasa». No hay ningún hook ni script que lo haga, y el spec no lo pide.
    - ✅ **RESUELTO** → `constitution.md` §3. Se sustituye la promesa de un hook inexistente por **el comando concreto**, ya probado contra el dataset actual, y se dice explícitamente que se corre a mano o desde el script de validación de la Fase 4. La comprobación ahora es ejecutable.
20. **Principio 6.** Ya se cumple en `docs/diseno.md` (pila de fuentes del sistema), pero el **lienzo de Claude Design** sigue cargando IBM Plex desde Google Fonts. Además, el criterio 8 y la comprobación del principio 6 solo miran `index.html` y `styles.css`, y no revisan los `.js`.

## Veredicto

**No está listo del todo, aunque está cerca.** La lógica central es sólida: sugerencia, matriz, validación y exportación. Antes del diseño hay que resolver:

- ~~**Bloqueantes:** el 2, el 8 y el 16.~~ ✅ **Resueltos** el 22/09/2026.
- ~~**Deberían resolverse:** el 17, el 18 y el 19.~~ ✅ **Resueltos** el 22/09/2026.
- **Pueden pasar a diseño y cerrarse en la Fase 3:** el resto (1, 3–7, 9–14, 20). El 15 se cerró de paso al corregir la cabecera del spec.

## Estado tras la resolución

Los seis puntos que bloqueaban están cerrados: el spec ya define qué ve y qué puede hacer el
operador, y las tres comprobaciones de la constitución que no se podían cumplir ahora son
ejecutables.

Quedan **13 abiertos**, ninguno bloqueante. Los tres que más conviene no olvidar en la Fase 3:

- **9 · Impacto que no cuadra con la zona.** R8 cruza categoría × urgencia, pero nadie valida que
  un impacto Alto corresponda a una zona crítica. Con el punto 16 resuelto, el impacto pasa a
  depender más de la zona, así que esta validación gana peso.
- **10 y 11 · La confirmación y la sugerencia pueden desincronizarse.** Si Claude Code regenera
  una sugerencia ya confirmada, o si el export vuelve al repo con `triaje` dentro, no está
  definido qué manda. Es el punto con más potencial de perder trabajo del operador.
- **14 · El mínimo de 40 caracteres del motivo** solo vive en el criterio de finalización 1; R1
  no lo exige. Hay que llevarlo a R1 o quitarlo del criterio.
