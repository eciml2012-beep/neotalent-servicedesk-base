# Matriz de trazabilidad — requisito → prueba

Cada requisito de la base de prueba y dónde se prueba. Cada test lleva la etiqueta del requisito:
`npx playwright test --list --grep "@R6( |$)"` lista los de R6. Recuento a 23/09/2026.

Estado: ✅ probado automáticamente · 👤 probado a mano (UAT) · ⚠️ parcial, con el límite declarado.

## Constitución

| Id | Regla | Pruebas | Técnica | Estado |
|---|---|---|---|---|
| P1 | La IA sugiere, la persona decide; nunca "aceptar todo" | `unit/estado-ticket` (P1), `e2e/ficha` (sin aceptar-todo, acciones fuera de la caja), `e2e/bandeja` (sugerido ≠ confirmado) | Transición de estados | ✅ |
| P2 | Ninguna petición a un host externo | `unit/constitucion` (P2), `e2e/seguridad` (recorrido completo vigilando peticiones) | Estático + dinámico | ✅ |
| P3 | Solo datos sintéticos, 60 tickets cerrados; texto del operador sin DNI, NIE ni matrículas (enmienda) | `unit/dataset` (P3), `unit/texto-operador` (formas de dato personal), `e2e/notas` (bloqueo y aviso en nota y motivo) | Valores límite, dominios cerrados, tabla de casos | ⚠️ los nombres propios no se detectan (límite declarado en R9) |
| P4 | Toda sugerencia se explica | `unit/dataset` (R1), `unit/estado-ticket` (motivo vacío), `e2e/bandeja` (motivo visible), `e2e/casos-limite` | Casos límite | ⚠️ "cita hechos del ticket" solo se comprueba en parte (el motivo menciona la zona) |
| P5 | Prioridad por la matriz, nunca guardada | `unit/prioridad` (R3), `unit/dataset`, `e2e/persistencia` (ni en localStorage ni en el export) | Tabla de decisión | ✅ |
| P6 | Stack plano; npm solo para tests | `unit/constitucion` (P6), `e2e/seguridad` (sin conexión) | Estático | ✅ |

## Spec — requisitos

|---|---|---|---|---|
| R1 | Forma de `sugerencia`, nulos en Sin clasificar, motivo ≥ 40 | `unit/dataset` | Particiones, valores límite | ✅ |
| R2 | Urgencia e impacto por hechos; brecha nunca Bajo; zonas críticas | `unit/dataset` (coherencia), `unit/prioridad` | Tabla de decisión | ⚠️ los juicios "una sola persona" y "no graba ahora" no son automatizables: revisión manual |
| R3 | Matriz 3 × 3 → 4 prioridades | `unit/prioridad` (9 celdas + nulos), `e2e/ficha` (recalcular en vivo) | Tabla de decisión | ✅ |
| R4 | Bandeja: campos, sugerido vs. sólido, filtro por defecto, orden, filtros, destacado | `unit/filtros`, `e2e/bandeja`, `e2e/aceptacion` (H1, H4) | Particiones, casos de uso | ✅ |
| R5 | Aceptar, corregir, Confirmado vs. Corregido contra la sugerencia, deshacer | `unit/estado-ticket`, `e2e/ficha`, `e2e/aceptacion` (H2, H3) | Transición de estados | ✅ |
| R6 | Dos claves, sin storage, beforeunload, export, cambios sin exportar, sincronización, reimportación | `e2e/persistencia`, `unit/estado-ticket` (snapshot), `e2e/aceptacion` (H5, H6) | Transición de estados, valores límite | ✅ |
| R7 | Métricas y tasa de corrección por categoría sugerida | `unit/filtros`, `e2e/metricas`, `e2e/aceptacion` (H7) | Casos calculados a mano | ✅ |
| R8 | Coherencia de la sugerencia y bloqueo de urgencia en la UI | `unit/prioridad`, `unit/dataset`, `e2e/ficha` (las 7 categorías), `e2e/casos-limite` | Tabla de decisión | ✅ |
| R9 | Notas (se añaden, sobreviven a Deshacer, se exportan, se unen al reimportar) y motivo de corrección (obligatorio solo en un Corregido, 10-200) | `unit/texto-operador`, `e2e/notas`, `e2e/integracion` (ida y vuelta), `e2e/aceptacion` (H8, H9) | Valores límite, transición de estados, casos de uso | ✅ |
| R10 | Crear un ticket nuevo: clasificador de reglas fijas (no IA), id SVD-4160+, Pendiente de confirmar, dos claves de localStorage, export junto con los 60 | `unit/clasificador-nuevo-ticket`, `e2e/nuevo-ticket`, `e2e/cobertura` | Tabla de decisión (R2/R8 reaplicada), casos de uso, XSS | ✅ |

## Spec — casos límite

| Caso | Prueba | Estado |
|---|---|---|
| Categoría fuera de las 7 | `unit/estado-ticket`, `e2e/casos-limite` | ✅ |
| Motivo vacío | `unit/estado-ticket`, `e2e/casos-limite` | ✅ |
| Combinación imposible | `unit/estado-ticket`, `e2e/casos-limite` | ✅ |
| Sin clasificar con urgencia/impacto no nulos | `unit/estado-ticket`, `e2e/casos-limite` | ✅ |
| Ticket sin `sugerencia` | `unit/estado-ticket`, `e2e/casos-limite` | ✅ |
| Deshacer tras corregir | `e2e/ficha` | ✅ |
| Deshacer después de exportar | `e2e/persistencia` | ✅ |
| Cerrar la pestaña sin exportar | `e2e/persistencia`, `e2e/aceptacion` (H6) | ✅ |
| Se borra el localStorage sin exportar | — | Aceptado y declarado en el spec: no hay nada que probar |
| El JSON cambia y hay confirmaciones de ids que ya no existen | `e2e/persistencia` | ✅ |
| Ticket cerrado en pendientes | `e2e/bandeja` (CF7) | ✅ |
| HTML o caracteres raros en el texto | `unit/constitucion`, `e2e/casos-limite` (XSS) | ✅ |
| HTML en una nota | `e2e/notas` (XSS) | ✅ |
| Nota vacía o solo espacios | `unit/texto-operador`, `e2e/notas` | ✅ |
| Nota o motivo con forma de DNI, NIE o matrícula | `unit/texto-operador`, `e2e/notas` | ✅ |
| Corregir sin motivo | `e2e/notas` | ✅ |
| Deshacer un ticket con notas | `e2e/notas` | ✅ |
| Reimportar un export con notas que ya estaban | `unit/texto-operador`, `e2e/integracion` | ✅ |

## Spec — criterios de finalización

| Id | Criterio | Pruebas | Estado |
|---|---|---|---|
| CF1 | 60 sugerencias, cuatro claves, motivo ≥ 40 | `unit/dataset` | ✅ (la parte "cita hechos" ⚠️) |
| CF2 | La prioridad coincide con la matriz, 9 combinaciones | `unit/prioridad` | ✅ |
| CF3 | Ninguna sugerencia incumple R8 | `unit/dataset`, `unit/prioridad` | ✅ |
| CF4 | Aceptar, corregir y deshacer sobreviven a recargar | `e2e/persistencia` | ✅ |
| CF5 | Exportar da un JSON válido con 60 tickets y originales intactos | `e2e/persistencia`, `e2e/aceptacion` (H5) | ✅ |
| CF6 | Sin sugerencia válida, sale como Sin clasificar y no rompe la bandeja | `e2e/casos-limite` | ✅ |
| CF7 | Los 10 cerrados salen en pendientes | `e2e/bandeja` | ✅ |
| CF8 | Sin URLs externas, funciona sin conexión | `unit/constitucion`, `e2e/seguridad` | ✅ |
| CF9 | Se cumplen los 6 principios | Todas las filas P1–P6 de arriba | ✅ salvo las partes ⚠️ de P3 y P4 |
| CF10 | Notas y motivo: se guardan, sobreviven a recargar y a Deshacer, se exportan; DNI/NIE/matrícula bloqueados | `e2e/notas`, `e2e/integracion` | ✅ |

## Integración

| Contrato | Pruebas | Estado |
|---|---|---|
| Los módulos de `js/utils/` encajan entre sí sobre el dataset real (bandeja y métricas cuentan lo mismo) | `unit/integracion` | ✅ |
| Export → sustituir `data/tickets.json` → otro navegador lee las mismas confirmaciones (R6, A6) | `e2e/integracion` | ✅ |
| Exportar → reimportar → exportar da el mismo archivo (idempotente) | `e2e/integracion` | ✅ |
| El JSON que escribe Claude Code se pinta entero sin descartes (R1) | `e2e/integracion`, `unit/dataset` | ✅ |

## docs/diseno.md y WCAG 2.2 AA

| Regla | Prueba | Estado |
|---|---|---|
| Contraste 4,5:1 (3:1 texto grande), temas claro y oscuro | `e2e/accesibilidad` | ✅ |
| Controles de 44 px, nada por debajo de 12 px, rojo solo para brechas | `e2e/accesibilidad` | ✅ |
| Teclado (2.1.1), foco visible (2.4.7), reflujo a 320 px (1.4.10) | `e2e/accesibilidad` | ✅ |
| Idioma (3.1.1), título (2.4.2), nombres accesibles (4.1.2) | `e2e/accesibilidad` | ✅ |
| Lector de pantalla, comprensión, comodidad en 8 h | `docs/pruebas/uat.md` | 👤 |
| "Filas compactas" | — | 👤 observación abierta en el informe |
