# Revisión QA del spec — segunda pasada

22/09/2026. Se hizo sobre `docs/spec.md` después de resolver la primera revisión (commit `0e22339`), cruzándolo con `docs/constitution.md` y `docs/diseno.md`.
Solo detecta: no propone soluciones.

> **Estado: 20 de 20 resueltos** (23/09/2026). El 22/09/2026 se cerraron los tres bloqueantes (2, 8,
> 16), los tres conflictos con la constitución (17, 18, 19) y el 15, una errata de conteo. El
> 23/09/2026, antes de arrancar la Fase 3, se cerraron los 13 restantes. Cada uno lleva debajo su
> resolución y el archivo donde quedó.

## Ambigüedades

1. **Impacto «una sola persona» (R2).** No se dice cómo decide la IA que un ticket afecta a una sola persona. Por ejemplo, ¿un doble fichaje es de una persona o de la zona? Es un juicio, no un hecho observable, y R2 exige hechos observables.
   - ✅ **RESUELTO** → `spec.md` R2. Es una acción sobre una credencial, alta, baja, turno o fichaje de alguien identificable, sin decir que ningún equipo, puerta o zona quede sin cobertura. Un doble fichaje: Bajo, es un dato de esa persona. Un lector que deja de reconocer a cualquiera que use la puerta: no es «una persona», manda la zona.
2. **«Sin clasificar» no es un estado del triaje (R4).** Los estados son tres: Pendiente, Confirmado y Corregido. No está dicho en qué estado queda un «Sin clasificar», ni si cuenta dentro de «Pendientes de confirmar».
   - ✅ **RESUELTO** → `spec.md` R4. Son **dos ejes independientes**: «Sin clasificar» es un valor de `categoria`, no un estado del triaje. Un «Sin clasificar» nace en `Pendiente de confirmar` y **sí cuenta** en «Pendientes de confirmar»; al clasificarlo el operador pasa a `Corregido`. La única combinación imposible es «Sin clasificar» + `Confirmado`, así que ahí el botón «Aceptar» no aparece.
3. **Orden de la bandeja (R4).** Dice «al final los confirmados», pero el filtro por defecto («Pendientes de confirmar») no los muestra. No está claro en qué vista se aplica ese orden.
   - ✅ **RESUELTO** → `spec.md` R4. El orden se aplica dentro de cualquier vista que mezcle estados (p. ej. «Todos»). Dentro de «Pendientes de confirmar» no hay confirmados, así que ahí el orden efectivo es Sin clasificar → prioridad.
4. **Corregir sin cambiar nada (R5).** Si el operador abre «Corregir» y guarda sin tocar ningún campo, no está dicho si queda como Confirmado o como Corregido.
   - ✅ **RESUELTO** → `spec.md` R5. Cuenta como `Confirmado`: no hay una tercera opción entre confirmar tal cual y corregir algo.
5. **Qué deshace «Deshacer».** Solo se describe deshacer después de corregir. No se dice si también deshace un «Aceptar».
   - ✅ **RESUELTO** → `spec.md` R5. Funciona igual en los dos casos: siempre vuelve el ticket a `Pendiente de confirmar` con la sugerencia original.
6. **Solapamiento de señales (R2 y categorías).** «Vigilancia que no está grabando» es una señal de urgencia Alta, pero ese caso encaja también en «Pérdida de registro o evidencia», cuya urgencia es libre. El mismo ticket puede recibir dos lecturas distintas.
   - ✅ **RESUELTO** → `spec.md` R2. Decide el tiempo verbal: no graba **ahora** → Alta; pérdida ya ocurrida sobre el archivo → Media.
7. **Qué se exporta de los pendientes (R6).** No se dice si los tickets pendientes llevan un objeto `triaje` vacío, `null` o ninguno.
   - ✅ **RESUELTO** → `spec.md` R6. `"triaje": null` explícito; la clave existe siempre, igual que las de `sugerencia`.

## Casos límite no cubiertos

8. **Correcciones incoherentes del operador.** R8 valida solo la sugerencia de la IA. Nada impide que el operador corrija a «Brecha de seguridad activa» con urgencia Baja.
   - ✅ **RESUELTO** → `spec.md` R8. La tabla vale igual para el operador, pero se aplica **en la interfaz, no rechazando**: al elegir una categoría con urgencia obligatoria, el desplegable de urgencia queda fijado en ese valor y explica por qué; con «Falsa alarma recurrente», `Alta` no aparece. No se bloquea a la persona, se le quita una opción que no existe. Si discrepa, cambia la categoría. No choca con el principio 1: la decisión de fondo —qué categoría tiene el ticket— sigue siendo suya.
9. **Impacto que no cuadra con la zona.** No hay ninguna validación de que el impacto sugerido coincida con la regla de zonas de R2, por ejemplo un impacto Alto en una zona no crítica. R8 solo cruza categoría y urgencia.
   - ✅ **RESUELTO** → `spec.md` R8. La validación de coherencia se amplía al impacto: salvo las excepciones de R2, debe coincidir con el que le toca por zona. Si no, es tan incoherente como una categoría × urgencia imposible.
10. **Misma id con una sugerencia nueva.** Si Claude Code regenera la sugerencia de un ticket que ya estaba confirmado, la confirmación de `localStorage` se aplica sobre una sugerencia distinta de la que se confirmó.
    - ✅ **RESUELTO** → `spec.md` R6. La confirmación guarda una copia de lo que aceptó (categoría, urgencia, impacto); si ya no coincide con la sugerencia actual, se invalida y el ticket vuelve a `Pendiente de confirmar`.
11. **El export vuelve al repo y ya trae `triaje`.** No está definido qué manda cuando `data/tickets.json` trae confirmaciones y el `localStorage` tiene otras.
    - ✅ **RESUELTO** → `spec.md` R6. El `triaje` que trae el JSON es el estado de partida; `localStorage` solo aporta confirmaciones posteriores. Si el mismo id choca, manda el JSON.
12. **Dos pestañas abiertas en el mismo navegador.** Comparten `svd-triaje` y pueden pisarse las confirmaciones.
    - ✅ **RESUELTO** → `spec.md`, fuera de alcance. Mismo caso que dos operadores exportando por separado: no hay regla automática, se decide a mano.
13. **Corregir a «Sin clasificar».** No se dice si el operador puede elegir «Sin clasificar» como corrección, ni qué pasa en ese caso con la urgencia y el impacto.
    - ✅ **RESUELTO** → `spec.md` R5. Sí puede; urgencia e impacto quedan en `null` igual que en R1, y cuenta como `Corregido`.

## Contradicciones internas

14. **Mínimo de 40 caracteres.** Solo aparece en el criterio de finalización 1. R1 no lo exige, y los casos límite solo tratan el motivo vacío.
    - ✅ **RESUELTO** → `spec.md` R1. El mínimo de 40 caracteres pasa a estar también en R1, no solo en el criterio de finalización.
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
    - ✅ **RESUELTO** → `spec.md`, criterio de finalización 8. Se amplía explícitamente a todo archivo de `js/`. El lienzo de `docs/diseno.md` es una herramienta externa: lo que carga en su vista previa no es parte del código entregado.

## Veredicto

**Resuelto por completo.** La lógica central era sólida desde la primera pasada: sugerencia,
matriz, validación y exportación. Los 20 hallazgos están cerrados:

- ~~**Bloqueantes:** el 2, el 8 y el 16.~~ ✅ **Resueltos** el 22/09/2026.
- ~~**Deberían resolverse:** el 17, el 18 y el 19.~~ ✅ **Resueltos** el 22/09/2026.
- ~~**Cerrados en la Fase 3:** el resto (1, 3–7, 9–14, 20).~~ ✅ **Resueltos** el 23/09/2026, antes
  de arrancar la Fase 3. El 15 se cerró de paso al corregir la cabecera del spec.

## Estado tras la resolución

Los 20 hallazgos de esta revisión están cerrados en `docs/spec.md` y trazados arriba, cada uno con
el requisito donde quedó la decisión. No queda ninguna ambigüedad, caso límite, contradicción
interna ni conflicto con la constitución pendiente antes de escribir código en la Fase 3.
