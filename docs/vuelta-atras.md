# Vuelta atrás — Mini Service Desk

Cómo deshacer un cambio, cómo volver entera a una versión anterior, qué pasa con lo guardado en
el navegador y quién decide hacerlo. Sin backend: todo esto es Git y, en el navegador, borrar o
ignorar `localStorage`.

## Versiones etiquetadas

| Etiqueta | Commit | Qué es |
|---|---|---|
| `v1.0-fase3` | `bab153f` | Fase 3 cerrada: bandeja, ficha, métricas, sugerencia clasificada, antes de la suite de pruebas |
| `v1.1-qa` | `0d43c9a` | Fase 4: suite de 220 pruebas, hook de commit, CI de GitHub y documentación QA |
| `v1.2-r9` | `cd1193f` | R9: notas del operador y motivo de corrección obligatorio |
| `v1.3-rediseno` | `f7bb1cb` | Vista C (lista y ficha lado a lado) con paleta índigo |

Ver todas: `git tag -n1`. Comparar dos versiones: `git diff v1.2-r9 v1.3-rediseno`.

## 1. Deshacer un cambio concreto (`git revert`)

Para un commit ya subido a `main`, sin reescribir el historial: crea un commit nuevo que aplica lo
contrario del que se revierte. Es la forma segura cuando otros ya se han bajado esos commits.

```bash
git revert --no-edit <hash-del-commit>   # ej.: git revert --no-edit f7bb1cb
npm test                                  # tiene que quedar en verde antes de subirlo
git push
```

- Si el commit que se revierte tocó capturas de `@visual`, el revert las devuelve también: no
  hace falta regenerarlas aparte.
- Si revertir dos commits en orden distinto al que se hicieron da conflicto, se resuelve a mano
  como cualquier conflicto de Git; `git revert --abort` cancela si hace falta.
- Nunca se usa `git reset` sobre `main` ya subida: reescribe el historial que el resto del equipo
  ya tiene.

## 2. Volver entera a una versión etiquetada

**Para mirarla o probarla sin tocar `main`** (recomendado primero):

```bash
git switch --detach v1.2-r9   # o cualquier otra etiqueta
npm test                      # confirma que esa versión sigue pasando hoy
git switch main               # vuelve a la rama de trabajo
```

**Para que `main` vuelva a ser esa versión**, sin perder los commits posteriores (quedan en el
historial, solo se deshace su efecto): un `revert` de cada commit posterior, del más nuevo al más
viejo, o un `revert` de un rango:

```bash
git revert --no-edit v1.2-r9..HEAD    # deshace todo lo posterior a v1.2-r9, un commit por vez
npm test
git push
```

`git reset --hard <etiqueta>` sobre `main` **no se usa**: borra de la rama remota el trabajo de
quien haya subido algo después, aunque sea recuperable localmente. Con un repositorio de una sola
persona el riesgo es menor, pero la regla es la misma que en cualquier equipo.

## 3. Qué pasa con `localStorage` al volver atrás

El código vuelve atrás; lo que hay guardado en el navegador de cada persona, no. `localStorage`
vive en el navegador, no en el repositorio, así que un `revert` o un cambio de rama no lo toca.

- **Volver de `v1.3-rediseno` a `v1.2-r9`:** el triaje guardado (`svd-triaje`) sigue leyéndose
  igual, porque R9 no cambió la forma del dato, solo la pantalla. No hay pérdida.
- **Volver de `v1.2-r9` a `v1.1-qa` (antes de R9):** el código anterior no conoce `motivoCorreccion`
  ni `_notas`; los ignora al leer, así que no rompe, pero **las notas y los motivos de corrección
  quedan invisibles** hasta que se vuelva a subir a `v1.2-r9` o posterior. No se borran solos.
- **Volver de cualquier versión a `v1.0-fase3` (antes de la clave `svd-triaje` como se conoce
  hoy):** revisar `estado-ticket.js` de esa versión antes de dar por bueno que lee lo mismo.
- **Si el cambio de código no es compatible con lo guardado** (un campo que cambió de forma, no
  solo se añadió), la app puede no cargar el triaje o cargarlo mal. La comprobación previa es
  abrir la app con las herramientas de desarrollador, mirar `localStorage.getItem("svd-triaje")`
  y confirmar que tiene la forma que esa versión del código espera.
- **Limpiar y empezar de cero, si hiciera falta:** borrar la clave `svd-triaje` desde las
  herramientas de desarrollador del navegador (Application → Local Storage). No hay ningún botón
  en la app para esto, a propósito (nadie borra el trabajo de otro por accidente).

En ningún caso una vuelta atrás del código exporta ni sincroniza `data/tickets.json`: ese archivo
solo cambia cuando alguien sustituye su contenido a mano por un export (spec R6, decisión A6).

## 4. Quién decide

- **Revertir un commit propio, recién subido, por un fallo evidente:** quien lo detecta lo puede
  hacer, avisando en el grupo.
- **Volver `main` a una versión anterior por varios commits, o deshacer una decisión de diseño o
  de la constitución** (como el rediseño o una enmienda de principio): lo decide el equipo, no
  Claude Code por su cuenta. Es lo mismo que dice la rúbrica de 6 puntos de la skill `qa-triaje`
  en el punto **Propiedad**: alguien del grupo tiene que haberlo mirado.
- **Antes de cualquier vuelta atrás que afecte a `main`:** `npm test` en la versión de destino,
  para no volver a algo que hoy ya no pasa (ver la prueba de abajo).

## Prueba hecha (24/09/2026)

Se revirtió `f7bb1cb` (el rediseño) en una rama aparte, sin tocar `main`:

```bash
git switch -c prueba/vuelta-atras main
git revert --no-edit f7bb1cb
npm test
```

**Resultado: 265 / 265 en verde**, igual que en `v1.2-r9`. Una primera pasada dentro de una
carpeta temporal muy anidada dio un fallo intermitente («download: canceled») en una prueba de
exportar; repetida 5 veces sobre `main` sin revertir salió 160 / 160 limpia, así que no era del
código revertido. Movida la prueba a una ruta normal, la rama revertida repitió el export 5 veces
también en 160 / 160 y `npm test` completo en 265 / 265: el fallo era de la ruta de archivo
temporal (Windows con rutas muy largas), no un defecto de la vuelta atrás. La rama y las carpetas
de prueba se borraron al terminar; no queda rastro en `main`.
