# Plan de pruebas — Mini Service Desk

Sigue la estructura del *Test Plan* de **ISO/IEC/IEEE 29119-3**, reducida a lo que un proyecto de
este tamaño necesita. Terminología de **ISTQB**. Qué tipos de prueba hacen falta se decide con las
características de calidad de **ISO/IEC 25010**. Accesibilidad según **WCAG 2.2 AA**; seguridad de
salida según **OWASP** (codificar la salida, nunca interpretar datos como marcado).

Versión 1 · 23/09/2026 · Fases 3 y 4 (Sesiones 3 y 4).

## 1. Alcance

**Elementos de prueba:** `index.html`, `css/styles.css`, todo `js/`, y `data/tickets.json` como
dato de entrada.

**Fuera de alcance:** lo que el spec deja fuera (login, alta de tickets, varios operadores a la
vez, SLA) y la calidad del texto de los motivos más allá de lo automatizable (el spec declara que
"citar hechos del ticket" no es comprobable del todo: se revisa a mano).

## 2. Base de prueba (de dónde salen los resultados esperados)

| Documento | Qué aporta |
|---|---|
| `docs/constitution.md` | P1–P6 y su "cómo se comprueba" |
| `docs/spec.md` | R1–R9, casos límite, criterios de finalización CF1–CF10, historias de usuario |
| `docs/diseno.md` | Reglas visuales medibles (44 px, 12 px, rojo solo para brechas, contraste AA) |
| WCAG 2.2 AA | Criterios de accesibilidad medibles sin herramientas extra |

El resultado esperado **nunca** sale de ejecutar la app y copiar lo que devuelve (lección de
`docs/pruebas-fase3.md`). Si el spec es ambiguo, se precisa en el spec antes de escribir el test.

## 3. Riesgos de producto y prioridad (pruebas basadas en riesgo)

| Riesgo | Impacto | Por qué | Cómo se mitiga |
|---|---|---|---|
| Una sugerencia se ve como decidida sin confirmar | Alto | Rompe P1, el principio central | Unitarios de estado + e2e de bandeja y ficha |
| Prioridad mal calculada | Alto | Decide qué se atiende primero (P5) | Tabla de decisión completa de R3 |
| El operador pierde trabajo | Alto | R6: localStorage, export, reimportación | e2e de persistencia, beforeunload, siembra |
| Sugerencia incoherente mostrada como válida | Alto | R8, P4 | Tabla de decisión R8 + casos límite |
| Texto del ticket interpretado como HTML | Medio | XSS (OWASP) | Estático + e2e con HTML inyectado |
| La app habla con el exterior | Medio | P2 | Estático + e2e que vigila cada petición |
| Accesibilidad insuficiente para 8 h de turno | Medio | diseno.md, WCAG | Contraste en dos temas, teclado, reflujo |
| Regresión visual tras un cambio de estilo | Bajo | La demo depende de cómo se ve | Capturas de referencia |
| Lentitud | Bajo | 60 tickets, sin backend | Presupuestos de tiempo holgados |

## 4. Estrategia

### Niveles (ISTQB)

| Nivel | Dónde | Qué |
|---|---|---|
| Estático | `tests/unit/constitucion.spec.js` | El código sin ejecutarlo: dependencias, URLs, `innerHTML`, responsabilidades por carpeta |
| Unitario (componente) | `tests/unit/*.spec.js` | Funciones puras de `js/utils/` y el dataset, en Node, sin navegador |
| Integración de componentes | `tests/unit/integracion.spec.js` | Los módulos de `js/utils/` encadenados sobre el dataset real: derivar → filtrar → ordenar → métricas |
| Integración de sistemas | `tests/e2e/integracion.spec.js` | El contrato de ida y vuelta de R6: exportar → sustituir `data/tickets.json` → otra sesión lo lee igual; y el contrato con Claude Code (el JSON que escribe, la app lo pinta entero) |
| Sistema (e2e) | `tests/e2e/*.spec.js` | La app real servida por `python -m http.server`, en Chromium |
| Aceptación | `tests/e2e/aceptacion.spec.js` + `docs/pruebas/uat.md` | Automatizada por historia de usuario (ATDD) y **UAT con una persona** |

Sin backend ni APIs, la integración de sistemas se reduce a los dos contratos por archivo que
tiene el proyecto: el JSON que escribe Claude Code y el JSON que exporta el navegador.

### Tipos de prueba (por característica de ISO/IEC 25010)

| Característica | Tipo | Etiqueta |
|---|---|---|
| Adecuación funcional | Funcionales por requisito | `@R1`…`@R9`, `@P1`…`@P6`, `@CL` |
| Fiabilidad | Casos límite, localStorage bloqueado, JSON que no carga | `@CL`, `@R6` |
| Usabilidad → accesibilidad | WCAG 1.4.3, 1.4.10, 2.1.1, 2.4.2, 2.4.7, 3.1.1, 4.1.2 | `@accesibilidad` |
| Seguridad | XSS, peticiones solo al propio origen | `@seguridad` |
| Mantenibilidad | Estáticos de arquitectura, cobertura, mutación | `@estatico`, `@cobertura` |
| Eficiencia de desempeño | Presupuestos de tiempo | `@rendimiento` |
| Compatibilidad | Funciona sin conexión; solo Chromium de momento (ver §8) | `@P6` |
| — (cambios) | Regresión: la suite entera; humo: el camino crítico | `@humo`, `@visual` |

### Técnicas de diseño de casos (ISO/IEC/IEEE 29119-4)

| Técnica | Dónde se aplica |
|---|---|
| Tabla de decisión | R3 (9 celdas), R8 (categoría × urgencia, impacto × zona) |
| Transición de estados | Pendiente → Confirmado / Corregido → Deshacer; cambios sin exportar ↔ exportado |
| Particiones de equivalencia | Estados del triaje, zonas críticas / no críticas, localStorage disponible / bloqueado |
| Valores límite | Motivo de 40 caracteres, medianoche local vs. UTC, 60 tickets, 320 px de ancho |
| Casos de uso | Las 9 historias de usuario del spec |
| Error guessing dirigido | Cada fila de "Casos límite" del spec |

## 5. Entorno

Node 24 · `@playwright/test` 1.63.0 (única dependencia, solo de desarrollo: constitución P6
enmendado) · Chromium de Playwright · servidor `http.server` de Python en `127.0.0.1:8000` ·
Windows. Las capturas de referencia visuales son de Windows (sufijo `-win32`).

## 6. Criterios de entrada y de salida

**Entrada:** el cambio compila en el navegador sin errores de consola y `data/tickets.json` es
JSON válido.

**Salida (puertas antes de commitear un cambio en `js/`, `css/`, `index.html` o `data/`):**

1. `npm test` en verde (265 tests hoy).
2. Ningún requisito sin al menos un test (`docs/pruebas/matriz-trazabilidad.md`).
3. Cobertura JS ≥ 95 % (`@cobertura`).
4. Tests nuevos vistos fallar al menos una vez (mutación manual o expectativa invertida).
5. Capturas de referencia nuevas revisadas por una persona antes de darlas por buenas.

**Salida de una fase:** lo anterior + la UAT de `docs/pruebas/uat.md` firmada.

## 7. Roles

| Quién | Qué |
|---|---|
| Claude Code | Diseña, escribe y ejecuta los tests; registra el informe; nunca aprueba la UAT |
| Operador de triaje (o quien haga de él) | Ejecuta la UAT y aprueba capturas y UX |
| Equipo | Decide sobre riesgos residuales y cambios de la constitución |

## 8. Riesgos del propio plan

- **Solo Chromium.** Firefox y WebKit no se prueban (se instalarían con
  `npx playwright install firefox webkit` y dos proyectos más en `playwright.config.js`). La
  descarga del export tiene un arreglo específico para Firefox que no está verificado en Firefox.
- **Capturas dependientes del sistema operativo.** En macOS o Linux hay que regenerarlas.
- **Accesibilidad sin herramienta automática completa** (axe-core sería otra dependencia): se
  cubren los criterios medibles; el lector de pantalla queda para la UAT.

## 9. Entregables

`docs/pruebas/plan-de-pruebas.md` (este) · `docs/pruebas/matriz-trazabilidad.md` ·
`docs/pruebas/uat.md` · `docs/pruebas/informe-de-pruebas.md` · `tests/` · informe HTML de
Playwright (`npm run test:informe`, no se versiona).
