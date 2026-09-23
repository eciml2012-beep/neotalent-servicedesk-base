# Informe de pruebas — Mini Service Desk

*Test Completion Report* según **ISO/IEC/IEEE 29119-3**. Plan: `docs/pruebas/plan-de-pruebas.md`.
Trazabilidad: `docs/pruebas/matriz-trazabilidad.md`. Pruebas manuales anteriores:
`docs/pruebas-fase3.md`.

**Fecha:** 23/09/2026 · **Entorno:** Windows, Node 24, Playwright 1.63.0, Chromium ·
**Comando:** `npm test`

## Resumen

| | |
|---|---|
| Pruebas automatizadas | **220** en 19 archivos (108 en Node: unitarias, datos, estáticas e integración; 112 en navegador) |
| Resultado | **220 / 220 en verde**, ~22 s |
| Estabilidad | Las e2e, ejecutadas 3 veces cada una: 0 intermitentes |
| Requisitos sin prueba | **Ninguno** (P1–P6, R1–R8, CF1–CF9, casos límite) |
| Cobertura JS (V8, aproximada) | **98,0 %** (umbral de la suite: 95 %) |
| Mutación manual | **8 / 8** bugs sembrados detectados |
| Defectos encontrados en esta pasada | 1 en la app, 6 en las propias pruebas |
| UAT con persona | **Pendiente** (`docs/pruebas/uat.md`) |

## Resultados por tipo

| Tipo | Archivos | Pruebas | Resultado |
|---|---|---|---|
| Estáticas (constitución, arquitectura, `innerHTML`) | `unit/constitucion` | 19 | ✅ |
| Unitarias (matriz, coherencia, estado, filtros, métricas, formato) | `unit/prioridad`, `estado-ticket`, `filtros`, `formato` | 72 | ✅ |
| Datos | `unit/dataset` | 14 | ✅ |
| Integración de componentes | `unit/integracion` | 3 | ✅ |
| Integración de sistemas (ida y vuelta del export, contrato con Claude Code) | `e2e/integracion` | 4 | ✅ |
| Sistema funcional (incluye XSS en casos límite) | `e2e/bandeja`, `ficha`, `persistencia`, `metricas`, `casos-limite` | 66 | ✅ |
| Aceptación automatizada (7 historias) | `e2e/aceptacion` | 7 | ✅ |
| Accesibilidad WCAG 2.2 AA + reglas de diseño | `e2e/accesibilidad` | 18 | ✅ |
| Seguridad (peticiones externas, sin conexión) | `e2e/seguridad` | 2 | ✅ |
| Regresión visual (5 pantallas × 2 temas + móvil) | `e2e/visual` | 11 | ✅ (referencias sin aprobar por una persona) |
| Rendimiento | `e2e/rendimiento` | 3 | ✅ |
| Cobertura | `e2e/cobertura` | 1 | ✅ |

## Defectos en la app

| # | Defecto | Cómo se encontró | Arreglo | Requisito |
|---|---|---|---|---|
| D1 | El nombre del export usaba la fecha **UTC**: entre las 00:00 y las 02:00 (hora de España) el archivo salía con la fecha de ayer | Valor límite: exportar a las 00:30 en `Europe/Madrid` con el reloj fijado | `fechaLocal()` en `js/utils/formato.js`, con su test unitario | R6 |

Los defectos de pasadas anteriores (6) están en `docs/pruebas-fase3.md`; todos tienen ahora una
prueba que los detectaría si volvieran.

## Defectos en las propias pruebas

Se anotan porque sin ellos el resultado no sería creíble: cada uno habría dado un falso rojo o,
peor, un falso verde.

| # | Error | Efecto | Arreglo |
|---|---|---|---|
| T1 | Los estáticos de arquitectura buscaban `localStorage` también en los **comentarios** | Falso rojo | Se quitan los comentarios antes de buscar |
| T2 | El servidor de pruebas tenía cola de 5 conexiones | Falso rojo intermitente (`ERR_CONNECTION_REFUSED`) con 8 navegadores | `request_queue_size = 128` en el arnés |
| T3 | El cálculo de contraste trataba `rgb(r, g, b)` sin alfa como **transparente** | Falso rojo masivo en el tema oscuro | Sin alfa = opaco |
| T4 | Un localizador de métricas coincidía con dos tarjetas ("Revisados" y "… revisados") | Falso rojo | Título exacto |
| T5 | La cobertura se perdía en cada `page.goto` (Chromium descarta los contadores al navegar) | Cobertura falsa del 41 % | Navegación por hash y recogida antes de cada recarga |
| T6 | El script de mutación restauraba los archivos con saltos de línea de Windows | 5 archivos marcados como modificados sin cambio real | Restaurados desde git; el script debe escribir con `newline=""` |

## Observaciones de UX (no son defectos; para la UAT y la Sesión 4)

1. **Densidad de la bandeja:** con motivos de ~190 caracteres cada fila mide ~180 px y caben 3 en
   pantalla. `diseno.md` pide "filas compactas" y el spec, decidir sin leer los 60 uno a uno.
2. **Rail en móvil:** funciona y no desborda, pero queda desordenado y ocupa ~230 px de alto.
3. **Columna de id:** 120 px para 8 caracteres, espacio que le falta al motivo.

## Riesgos residuales y qué no se ha probado

- **UAT con una persona:** pendiente. Hasta entonces las capturas de referencia no están aprobadas.
- **Firefox y WebKit:** sin probar (plan §8). El arreglo de la descarga para Firefox no está
  verificado en Firefox.
- **Lector de pantalla real:** sin probar; los nombres accesibles sí.
- **Calidad del motivo:** solo se comprueba que cite la zona; el resto, a mano (declarado en el spec).
- **Juicios de R2** ("una sola persona", "no graba ahora"): no automatizables.

## Recomendación

La app cumple el spec y la constitución en todo lo que se puede comprobar automáticamente.
**Apta para la demo**, pendiente de la UAT de `docs/pruebas/uat.md` y de decidir si las tres
observaciones de UX entran en la pasada de diseño de la Sesión 4.
