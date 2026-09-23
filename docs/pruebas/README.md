# Cómo está organizado el QA del Mini Service Desk

QA aquí no es solo "pasar tests": es asegurar que lo que se entrega cumple la constitución y el
spec, con pruebas que cualquiera puede repetir con un comando, y un registro creíble de lo que se
probó, lo que falló y lo que no se ha probado.

## Estándares que se siguen

| Estándar | Para qué se usa |
|---|---|
| **ISO/IEC/IEEE 29119** | El marco: proceso (planificar → diseñar → ejecutar → informar), los documentos de esta carpeta (parte 3) y las técnicas de diseño de casos (parte 4) |
| **ISTQB** | Niveles de prueba y vocabulario: estático, unitario, integración, sistema, aceptación; regresión y humo |
| **ISO/IEC 25010** | Qué *tipos* de prueba hacen falta: uno por característica de calidad (funcional, fiabilidad, accesibilidad, seguridad, mantenibilidad, rendimiento) |
| **WCAG 2.2 AA** | Accesibilidad medible (contraste, teclado, reflujo, nombres accesibles) |
| **OWASP** | El texto que viene de datos se pinta como texto, nunca como HTML |

## Las piezas y qué hace cada una

```
                 ┌──────────────────────────────────────────────┐
  la regla  ───► │ CLAUDE.md               comandos y puertas   │
  el método ───► │ .claude/skills/qa-triaje  cómo probar aquí   │
                 └──────────────────────────────────────────────┘
                 ┌──────────────────────────────────────────────┐
  obligan   ───► │ hook de commit   npm test antes de cada      │
                 │                  commit de Claude Code       │
                 │ CI (GitHub)      npm test en cada PR y push  │
                 └──────────────────────────────────────────────┘
                 ┌──────────────────────────────────────────────┐
  prueban   ───► │ tests/           265 pruebas automatizadas   │
                 │ docs/pruebas/uat.md  UAT con una persona     │
                 └──────────────────────────────────────────────┘
                 ┌──────────────────────────────────────────────┐
  registran ───► │ docs/pruebas/    plan, trazabilidad, informe │
                 └──────────────────────────────────────────────┘
```

| Pieza | Dónde | Qué hace | Limitación |
|---|---|---|---|
| Regla | `CLAUDE.md` (Comandos, Invariantes) | Dice qué hay que cumplir antes de commitear | Es un texto: nadie lo hace cumplir |
| Método | `.claude/skills/qa-triaje/` | Enseña a Claude cómo probar aquí: técnicas, trampas, flujo, formato del registro | Claude decide si la carga |
| Hook | `.claude/settings.json` → `.claude/hooks/pruebas-antes-de-commit.mjs` | Cada `git commit` de Claude Code pasa antes `npm test`; si falla, se bloquea | Solo vigila a Claude Code, no los commits hechos a mano |
| CI | `.github/workflows/pruebas.yml` | `npm test` en GitHub Actions (Linux) en cada PR y en cada push a `main` | Excluye `@visual` (capturas hechas en Windows) |
| Suite | `tests/` | Las pruebas automatizadas | — |
| UAT | `docs/pruebas/uat.md` | Una persona comprueba que la app *sirve*, no solo que funciona | Manual, por definición |

## Documentos de esta carpeta (ISO/IEC/IEEE 29119-3)

| Documento | Qué contiene | Cuándo se actualiza |
|---|---|---|
| [`plan-de-pruebas.md`](plan-de-pruebas.md) | Alcance, base de prueba, riesgos, niveles, tipos, técnicas, entorno, criterios de salida, roles | Al cambiar el alcance o la estrategia |
| [`matriz-trazabilidad.md`](matriz-trazabilidad.md) | Cada requisito (P1–P6, R1–R9, casos límite, CF1–CF10) → qué pruebas lo cubren | Al añadir un requisito o una prueba |
| [`uat.md`](uat.md) | Guion de aceptación para una persona (9 historias + revisión visual) y acta | Antes de cada demo o cierre de fase |
| [`informe-de-pruebas.md`](informe-de-pruebas.md) | Resultados, defectos de la app, defectos de las propias pruebas, riesgos residuales | Después de cada pasada importante |
| `../pruebas-fase3.md` | Registro histórico de las pruebas manuales de la Fase 3, antes de la suite | No se toca |

## La suite (`tests/`)

```
tests/
├── unit/                        Node, sin navegador (~2 s)
│   ├── prioridad.spec.js        matriz R3 y coherencia R8 (tablas de decisión)
│   ├── estado-ticket.spec.js    estados del triaje, casos límite de la sugerencia
│   ├── filtros.spec.js          orden, filtros y métricas
│   ├── formato.spec.js          fechas (valores límite)
│   ├── texto-operador.spec.js   R9: largos, DNI/NIE/matrícula, unir notas
│   ├── dataset.spec.js          data/tickets.json: 60 tickets, R1, R8
│   ├── constitucion.spec.js     estáticas: dependencias, URLs, innerHTML, arquitectura
│   └── integracion.spec.js      los módulos juntos sobre el dataset real
├── e2e/                         Chromium contra la app real
│   ├── bandeja · ficha · persistencia · metricas · casos-limite   sistema
│   ├── notas.spec.js            R9: notas y motivo de corrección
│   ├── integracion.spec.js      ida y vuelta del export (R6, R9)
│   ├── aceptacion.spec.js       una prueba por historia de usuario
│   ├── accesibilidad.spec.js    WCAG 2.2 AA y reglas de diseno.md
│   ├── seguridad.spec.js        sin peticiones externas, sin conexión
│   ├── visual.spec.js           capturas de referencia (+ carpeta -snapshots)
│   ├── rendimiento.spec.js      presupuestos de tiempo
│   └── cobertura.spec.js        cobertura JS ≥ 95 %
└── soporte/
    ├── app.js                   arnés: sembrar estado, dataset alterado, exportar…
    └── servidor.py              servidor de pruebas (http.server con cola ampliada)
```

Configuración: `playwright.config.js` (proyectos `unit` y `e2e`) y `package.json` (solo
`devDependencies`; la app no necesita instalar nada, constitución principio 6).

## Tipos de prueba

| Tipo (ISTQB / ISO 25010) | Etiqueta | Qué asegura |
|---|---|---|
| Estática | `@estatico` | La constitución y la arquitectura, sin ejecutar el código |
| Unitaria | `@R3`, `@R8`… | Funciones puras con todas sus combinaciones |
| Datos | `@datos` | El dataset cumple R1 y R8 y el reparto documentado |
| Integración | `@integracion` | Módulos juntos; el export vuelve al repo y se lee igual |
| Sistema | `@R4`…`@R9` | Flujos del operador con navegador real |
| Aceptación | `@aceptacion` | Cada historia de usuario, Dado/Cuando/Entonces |
| Accesibilidad | `@accesibilidad` | WCAG 1.4.3, 1.4.10, 2.1.1, 2.4.2, 2.4.7, 3.1.1, 4.1.2 |
| Seguridad | `@seguridad` | XSS y ninguna petición al exterior |
| Regresión visual | `@visual` | Cada pantalla contra su captura aprobada |
| Rendimiento | `@rendimiento` | Presupuestos de tiempo |
| Cobertura | `@cobertura` | ≥ 95 % del JS ejecutado |
| Humo | `@humo` | El camino crítico, en segundos |
| Regresión | — | La suite entera |

Cada prueba lleva la etiqueta del requisito que comprueba, así que "¿qué prueba R6?" se responde
con `npx playwright test --list --grep "@R6( |$)"`.

## Cuándo se prueba

| Momento | Qué | Quién lo hace cumplir |
|---|---|---|
| Mientras se programa | `npm run test:humo` (~8 s) | La skill |
| Antes de cada commit | `npm test` completo (~22 s) | El hook |
| En cada PR y push a `main` | `npm test` sin `@visual` | El CI |
| Antes de juntar una rama con `main` | Regresión completa sobre la rama actualizada con `main` | La skill / el CI |
| Tras reclasificar `data/tickets.json` | `npm test` completo | El hook |
| Tras un cambio visual intencionado | `npm run test:capturas` + revisión humana | Una persona |
| Antes de una demo o al cerrar fase | Regresión + UAT + informe | Una persona |

## Comandos

```bash
npm install                  # una vez: instala Playwright Test
npm test                     # regresión completa
npm run test:humo            # camino crítico
npm run test:unit            # solo Node
npm run test:e2e             # solo navegador
npm run test:aceptacion      # historias de usuario
npm run test:accesibilidad   # WCAG
npm run test:capturas        # regenerar capturas de referencia (cambio visual intencionado)
npm run test:informe         # informe HTML del último run
```

## Puertas antes de commitear

1. `npm test` en verde (lo hace cumplir el hook).
2. Ningún requisito del cambio sin prueba (matriz de trazabilidad).
3. Cobertura ≥ 95 % (lo comprueba `@cobertura`).
4. Cada prueba nueva vista fallar al menos una vez.
5. `data/tickets.json` sin cambios, salvo que el cambio sea clasificar.

## Cómo se añade una prueba

1. Busca en la matriz qué requisito toca el cambio.
2. Escríbela en la capa más baja posible (Node antes que navegador), con la etiqueta del requisito
   y el resultado esperado sacado del spec, nunca de ejecutar la app.
3. Mírala fallar (rompe a propósito lo que prueba) y luego pasar.
4. Actualiza la matriz y, si encontraste algo, el informe.

Las recetas (arnés, selectores, trampas ya pisadas) están en
`.claude/skills/qa-triaje/references/playwright.md`.

## Estado a 23/09/2026

- **265 / 265** en local; en el CI (Linux) corren todas menos las 11 `@visual`.
- Cobertura JS **98 %**; **11 / 11** bugs sembrados a mano detectados (mutación manual: 8 de la
  Fase 3 y 3 de R9).
- Pendiente: la **UAT con una persona** y aprobar las capturas visuales.
- No cubierto: Firefox y WebKit, lector de pantalla real, y las partes del spec que no se
  pueden automatizar (que el motivo "cite hechos", los juicios de R2).
