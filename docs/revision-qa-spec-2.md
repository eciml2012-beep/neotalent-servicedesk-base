# Revisión QA del spec — segunda pasada

22/09/2026. Se hizo sobre `docs/spec.md` después de resolver la primera revisión (commit `0e22339`), cruzándolo con `docs/constitution.md` y `docs/diseno.md`.
Solo detecta: no propone soluciones.

## Ambigüedades

1. **Impacto «una sola persona» (R2).** No se dice cómo decide la IA que un ticket afecta a una sola persona. Por ejemplo, ¿un doble fichaje es de una persona o de la zona? Es un juicio, no un hecho observable, y R2 exige hechos observables.
2. **«Sin clasificar» no es un estado del triaje (R4).** Los estados son tres: Pendiente, Confirmado y Corregido. No está dicho en qué estado queda un «Sin clasificar», ni si cuenta dentro de «Pendientes de confirmar».
3. **Orden de la bandeja (R4).** Dice «al final los confirmados», pero el filtro por defecto («Pendientes de confirmar») no los muestra. No está claro en qué vista se aplica ese orden.
4. **Corregir sin cambiar nada (R5).** Si el operador abre «Corregir» y guarda sin tocar ningún campo, no está dicho si queda como Confirmado o como Corregido.
5. **Qué deshace «Deshacer».** Solo se describe deshacer después de corregir. No se dice si también deshace un «Aceptar».
6. **Solapamiento de señales (R2 y categorías).** «Vigilancia que no está grabando» es una señal de urgencia Alta, pero ese caso encaja también en «Pérdida de registro o evidencia», cuya urgencia es libre. El mismo ticket puede recibir dos lecturas distintas.
7. **Qué se exporta de los pendientes (R6).** No se dice si los tickets pendientes llevan un objeto `triaje` vacío, `null` o ninguno.

## Casos límite no cubiertos

8. **Correcciones incoherentes del operador.** R8 valida solo la sugerencia de la IA. Nada impide que el operador corrija a «Brecha de seguridad activa» con urgencia Baja.
9. **Impacto que no cuadra con la zona.** No hay ninguna validación de que el impacto sugerido coincida con la regla de zonas de R2, por ejemplo un impacto Alto en una zona no crítica. R8 solo cruza categoría y urgencia.
10. **Misma id con una sugerencia nueva.** Si Claude Code regenera la sugerencia de un ticket que ya estaba confirmado, la confirmación de `localStorage` se aplica sobre una sugerencia distinta de la que se confirmó.
11. **El export vuelve al repo y ya trae `triaje`.** No está definido qué manda cuando `data/tickets.json` trae confirmaciones y el `localStorage` tiene otras.
12. **Dos pestañas abiertas en el mismo navegador.** Comparten `svd-triaje` y pueden pisarse las confirmaciones.
13. **Corregir a «Sin clasificar».** No se dice si el operador puede elegir «Sin clasificar» como corrección, ni qué pasa en ese caso con la urgencia y el impacto.

## Contradicciones internas

14. **Mínimo de 40 caracteres.** Solo aparece en el criterio de finalización 1. R1 no lo exige, y los casos límite solo tratan el motivo vacío.
15. **Número de hallazgos.** La cabecera del spec habla de «los 17 hallazgos» y el commit `0e22339` de «los 20 hallazgos».
16. **Brecha activa con prioridad Media.** Una brecha es siempre urgencia Alta (R8). Si afecta a una persona («permiso que debería estar revocado»), el impacto es Bajo y la matriz da prioridad **Media**. Choca con la intención del diseño, donde el rojo se reserva para las brechas, y con la historia 4 (atender primero lo crítico).

## Conflictos con la constitución

17. **Principio 1.** Dice «hasta que el operador acepta o corrige la sugerencia de categoría y prioridad». Según R1, la IA no sugiere prioridad: sugiere urgencia e impacto.
18. **Principio 2.** Su comprobación exige «ninguna llamada de red de salida», pero la app hace `fetch("data/tickets.json")`. Es una lectura local; la redacción no distingue entre local y externo.
19. **Principio 3.** Su comprobación dice «si el número de tickets o el rango cambia, el commit no pasa». No hay ningún hook ni script que lo haga, y el spec no lo pide.
20. **Principio 6.** Ya se cumple en `docs/diseno.md` (pila de fuentes del sistema), pero el **lienzo de Claude Design** sigue cargando IBM Plex desde Google Fonts. Además, el criterio 8 y la comprobación del principio 6 solo miran `index.html` y `styles.css`, y no revisan los `.js`.

## Veredicto

**No está listo del todo, aunque está cerca.** La lógica central es sólida: sugerencia, matriz, validación y exportación. Antes del diseño hay que resolver:

- **Bloqueantes:** el 2, el 8 y el 16. Definen qué ve y qué puede hacer el operador, y afectan directamente a la bandeja y a la ficha.
- **Deberían resolverse:** el 17, el 18 y el 19. Son comprobaciones de la constitución que hoy no se pueden cumplir tal como están escritas.
- **Pueden pasar a diseño y cerrarse en la Fase 3:** el resto.
