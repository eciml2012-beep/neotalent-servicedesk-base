# Diagnóstico — SVD-4113

- **id:** SVD-4113
- **título:** Cámara 8 sin grabar en Perímetro exterior
- **zona:** Perímetro exterior
- **fecha:** 2026-09-02
- **estado:** abierto
- **categoría:** Sin clasificar

## Motivo que trae el ticket

> La cámara de Perímetro exterior lleva 19 días sin grabar y solo muestra pantalla en negro: el
> texto no permite decidir si el equipo está averiado o si solo ha dejado de guardar; requiere
> comprobación en sitio.

## Por qué el clasificador de reglas fijas no lo detectó

`js/utils/clasificador-nuevo-ticket.js` recorre `REGLAS` en orden y solo asigna categoría si el
texto (título + descripción en minúsculas) contiene alguna de las claves literales de esa regla.
El texto de este ticket es:

> "cámara 8 sin grabar en perímetro exterior la cámara 8 de perímetro exterior lleva 19 días sin
> grabar, solo muestra pantalla en negro."

Ninguna clave coincide de forma literal:

| Regla candidata | Claves que casi encajan | Por qué no coincide |
|---|---|---|
| Brecha de seguridad activa | `no está grabando`, `no esta grabando` | El ticket dice **"sin grabar"**, no "no está grabando" — coincidencia de sentido, no de texto |
| Equipo de campo averiado | `no responde`, `averiado`, `no funciona`, `lento` | Ninguna de estas palabras aparece; el ticket no dice explícitamente que el equipo esté averiado |
| Pérdida de registro o evidencia | `no guarda`, `no se guardó` | "solo muestra pantalla en negro" no contiene ninguna de estas claves |

**Palabras clave que habrían necesitado** las `REGLAS` para clasificarlo: una variante literal
como `"sin grabar"` o `"pantalla en negro"` añadida a la regla de `"Brecha de seguridad activa"`
(o a `"Equipo de campo averiado"`, según se interprete si es un fallo de cámara o una brecha de
vigilancia). Al no existir esa clave exacta, el motor de reglas fijas no encuentra ninguna
coincidencia y devuelve `Sin clasificar`.

## Por qué no tiene prioridad

Según `docs/constitution.md` (principio 5: "la prioridad la calcula la app, no la inventa la IA")
y `js/utils/prioridad.js`, la prioridad es una función pura de `urgencia × impacto`. Con
`categoria: "Sin clasificar"`, `sugerencia.urgencia` y `sugerencia.impacto` valen `null` por
diseño (ver invariantes de Fase 3 en `CLAUDE.md`): sin esos dos ejes no hay entrada válida en la
matriz de prioridad, así que **no aplica** calcular ninguna prioridad para este ticket hasta que
un operador lo clasifique manualmente.
