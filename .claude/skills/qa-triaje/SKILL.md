---
name: qa-triaje
description: Aseguramiento de calidad (QA) del Mini Service Desk con estándares reconocidos (ISO/IEC/IEEE 29119, ISTQB, ISO/IEC 25010, WCAG 2.2 AA, OWASP) sobre la suite de Playwright Test que ya existe en tests/. Úsala siempre que haya que probar o asegurar la calidad de algo del proyecto — escribir o arreglar tests, "verifica que funciona", pasar una regresión o el humo, hacer QA del código, comprobar que se cumple el spec o la constitución, preparar la demo o la UAT, antes de commitear un cambio en js/, css/, index.html o data/, o cuando pregunten qué está probado, qué falta o cuánta cobertura hay — aunque no digan "test", "QA" ni "Playwright". La revisión de documentos (QA del spec) también encaja aquí como primera etapa.
---

# QA del Mini Service Desk

QA aquí no es "pasar los tests": es asegurar que lo que se entrega cumple la constitución y el spec,
con pruebas que cualquiera pueda repetir con un comando y un registro que alguien pueda creer.

## Dónde está todo

| Qué | Dónde |
|---|---|
| Plan de pruebas (qué, cómo, riesgos, criterios de salida) | `docs/pruebas/plan-de-pruebas.md` |
| Matriz requisito → prueba | `docs/pruebas/matriz-trazabilidad.md` |
| UAT para una persona, con acta | `docs/pruebas/uat.md` |
| Último informe de resultados | `docs/pruebas/informe-de-pruebas.md` |
| Suite | `tests/unit/` (Node, sin navegador) · `tests/e2e/` (Chromium) · `tests/soporte/app.js` (arnés) |
| Configuración | `playwright.config.js` (proyectos `unit` y `e2e`, servidor Python en 127.0.0.1:8000) |
| Recetas y trampas ya pisadas | `references/playwright.md` — léelo antes de escribir el primer test de la sesión |

## Comandos

```bash
npm test                    # todo (≈ 20 s): la regresión completa
npm run test:humo           # camino crítico (≈ 8 s): tras cada cambio pequeño
npm run test:unit           # solo Node: matriz, coherencia, estado, dataset, estáticos
npm run test:e2e            # solo navegador
npx playwright test --grep "@R6( |$)"   # lo que prueba un requisito
npx playwright test -g "texto del título"  # un test
npm run test:capturas       # regenerar referencias visuales (solo si el cambio visual es intencionado)
npm run test:informe        # informe HTML del último run
```

## Estándares, y para qué sirve cada uno aquí

- **ISO/IEC/IEEE 29119** — el marco: proceso (planificar → diseñar → ejecutar → informar), los
  documentos de `docs/pruebas/` (parte 3) y las técnicas de diseño de casos (parte 4).
- **ISTQB** — niveles y vocabulario: estático, unitario, sistema, aceptación; regresión y humo.
- **ISO/IEC 25010** — qué *tipos* de prueba hacen falta: una por característica de calidad que
  importe (funcional, fiabilidad, accesibilidad, seguridad, mantenibilidad, rendimiento).
- **WCAG 2.2 AA** — accesibilidad medible; **OWASP** — el texto de datos nunca como marcado.

## Tipos de prueba de este repo

| Tipo | Etiqueta | Qué asegura |
|---|---|---|
| Estática | `@estatico` | Constitución y arquitectura sin ejecutar: sin dependencias, sin URLs externas, sin `innerHTML`, cada carpeta en su papel |
| Unitaria | `@R3`, `@R8`… en `tests/unit` | Funciones puras con todas sus combinaciones |
| Datos | `@datos` | El dataset: 60 tickets, R1, R8, reparto documentado |
| Integración | `@integracion` | Módulos juntos sobre el dataset real; ida y vuelta del export (R6); contrato con Claude Code |
| Sistema (e2e) | `@R4`…`@R9` en `tests/e2e` | Flujos del operador con DOM, `localStorage`, navegación y descarga reales |
| Aceptación | `@aceptacion` | Una por historia de usuario, Dado/Cuando/Entonces. La UAT de verdad la hace una persona |
| Accesibilidad | `@accesibilidad`, `@diseno` | WCAG 1.4.3, 1.4.10, 2.1.1, 2.4.2, 2.4.7, 3.1.1, 4.1.2 y reglas de `diseno.md` |
| Seguridad | `@seguridad` | XSS, ninguna petición externa, funciona sin conexión |
| Regresión visual | `@visual` | Cada pantalla contra su captura aprobada |
| Rendimiento | `@rendimiento` | Presupuestos de tiempo holgados |
| Cobertura | `@cobertura` | ≥ 95 % del JS ejecutado en un recorrido completo |
| Humo | `@humo` | Subconjunto del camino crítico |
| Regresión | — | La suite entera, cada vez |

## Principios (y la lección de la que sale cada uno)

**El spec es el oráculo.** El resultado esperado sale de la constitución, el spec o `diseno.md`,
nunca de ejecutar la app y copiar lo que devuelve. En la Fase 3 una prueba dio por bueno un bug
(reabrir un Corregido lo pasaba a Confirmado) porque la expectativa salió de mirar la app. Si el
spec es ambiguo, dilo y propón la precisión en `spec.md` antes de escribir el test.

**Trazabilidad.** Cada test lleva la etiqueta de su requisito (`@P1`–`@P6`, `@R1`–`@R9`,
`@CF1`–`@CF10`, `@CL`) y un título que describe comportamiento. Un requisito sin test es un hueco
visible en la matriz; un test que falla dice qué regla se ha roto.

**Pirámide.** Lo que se pueda probar en Node se prueba en Node: la tabla de 9 celdas de R3 no
necesita un navegador; que Aceptar no aparezca en un «Sin clasificar», sí.

**Técnicas, no inspiración.** Tabla de decisión (R3, R8), transición de estados (triaje,
exportado ↔ sin exportar), particiones y valores límite (motivo de 40, motivo de corrección de 10, nota de 500, medianoche
local, 320 px),
casos de uso (historias), y cada fila de "Casos límite" del spec como un caso.

**FIRST.** Independiente (Playwright da `localStorage` vacío por test; si hace falta estado,
se siembra en el test), repetible (nada de fecha real, orden de ejecución ni editar
`data/tickets.json`), auto-validado, rápido. **AAA** y un comportamiento por test.

**Mira fallar cada test nuevo.** Rompe a propósito lo que prueba y comprueba que se pone en rojo
por el motivo correcto. La suite actual se validó sembrando 8 bugs a mano: los 8 los atrapó.

**Cuando algo falla, decide contra el spec quién tiene razón.** En esta suite hubo 1 bug de la
app y 6 de las propias pruebas y sus herramientas (comentarios que se leían como código, contraste mal medido,
cobertura perdida al navegar…). Nunca "arregles" un test para que pase sin mirar el spec.

## Flujo para cualquier cambio

1. **Impacto:** qué requisitos toca el cambio (`docs/pruebas/matriz-trazabilidad.md`). Un cambio
   en `estado-ticket.js` toca R4, R5, R6 y R7, no "una función".
2. **Revisa antes de probar:** relee esos requisitos contra el código. En este proyecto la
   relectura del spec encontró más bugs que los clics.
3. **Tests:** añade o ajusta en la capa más baja posible, con su etiqueta, siguiendo
   `references/playwright.md`. Míralos fallar.
4. **Ejecuta:** `npm run test:humo` mientras trabajas; `npm test` antes de dar nada por hecho.
5. **Si el cambio es visual e intencionado:** `npm run test:capturas` y avisa de que una persona
   tiene que aprobar las capturas nuevas.
6. **Registra:** actualiza la matriz si hay requisito nuevo y añade al informe lo que se
   encontró (formato abajo).

## Cuándo se prueba

| Momento | Qué se ejecuta | Por qué |
|---|---|---|
| Mientras se programa | `npm run test:humo` o `npm run test:unit` (segundos) | Feedback rápido; no hace falta la suite entera en cada cambio |
| Antes de cada commit | `npm test` completo | Puerta obligatoria (abajo) |
| Antes de integrar una rama en `main` (PR) | `npm test` completo **sobre la rama actualizada con `main`** | Dos ramas que pasan por separado pueden romperse al juntarse |
| Justo después de integrar en `main` | `npm test` completo | Lo que se prueba es lo que queda, no lo que había en cada rama |
| Tras cambiar `data/tickets.json` (reclasificar) | `npm test` completo | El dataset alimenta casi todas las pruebas |
| Tras un cambio visual intencionado | `npm run test:capturas` + revisión humana | Una captura nueva no está aprobada hasta que alguien la mira |
| Antes de una demo o al cerrar una fase | `npm test` + UAT (`docs/pruebas/uat.md`) + informe | Criterio de salida de la fase |

Con varias ramas vivas, la regresión completa no se sustituye por la de cada rama: lo que se
entrega es la combinación. Si alguna vez hay integración continua, `npm test` va en cada PR y en
cada push a `main`.

## Puertas antes de commitear

La primera la hace cumplir un hook (`.claude/settings.json`): cada `git commit` de Claude Code
pasa antes `npm test` y se bloquea si falla. En GitHub, el workflow `pruebas.yml` hace lo mismo en
cada PR y en cada push a `main`. Las demás son responsabilidad de quien commitea.

Un cambio en `js/`, `css/`, `index.html` o `data/` no se commitea si falla cualquiera:

1. `npm test` en verde.
2. Ningún requisito del cambio sin test.
3. Cobertura ≥ 95 % (lo comprueba `@cobertura` dentro de `npm test`).
4. `git diff --stat -- data/tickets.json` vacío, salvo que el cambio sea clasificar.

## Lo que nunca se hace

- **Editar `data/tickets.json` para montar un caso:** se sirve un dataset alterado con
  `servirDataset()` (`page.route`).
- **Datos personales reales en pruebas**, tampoco "de ejemplo" (principio 3).
- **`waitForTimeout` o esperas fijas:** aserciones web-first, que esperan solas.
- **Otra dependencia** (axe, c8, Stryker…) sin enmendar antes el principio 6: la excepción cubre
  Playwright Test y nada más. Lo que esas herramientas harían se hace a mano, como ya está hecho.
- **Aprobar la UAT o las capturas visuales en nombre de una persona.**

## Formato del registro

Añade al informe (`docs/pruebas/informe-de-pruebas.md`) o a uno nuevo por fase:

```markdown
## <Qué se probó> (<fecha>)
**Alcance:** qué cambió y qué requisitos toca.
**Cómo:** comando y capas.
**Resultado:** N pruebas, N en verde; cobertura; mutantes si se sembraron.
**Defectos de la app:** defecto → cómo se encontró → arreglo → requisito.
**Defectos de las propias pruebas:** error → efecto (falso rojo / falso verde) → arreglo.
**Qué no se ha probado:** y por qué.
```

La sección de defectos de las propias pruebas no es opcional: es lo que hace creíble el resto.
