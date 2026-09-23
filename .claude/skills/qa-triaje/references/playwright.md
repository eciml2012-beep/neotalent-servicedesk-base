# Recetas de Playwright para este repo

Convenciones y soluciones ya probadas. Cada "trampa" es un error que ya se cometió al escribir la
suite (informe de pruebas, tabla "Defectos en las propias pruebas").

## Estructura de un test

```js
// Nivel: … Técnica: … Base de prueba: spec R… / constitución P…
import { test, expect } from "@playwright/test";
import { abrir, aceptar, corregir, exportar, fila, leerTriaje, sembrarTriaje, servirDataset, datasetReal } from "../soporte/app.js";

test.describe("R5 · corregir", { tag: ["@R5"] }, () => {
  test("cambiar un campo → Corregido", async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });          // Preparar + Actuar
    expect((await leerTriaje(page))["SVD-4104"].estado).toBe("Corregido"); // Comprobar
  });
});
```

- Unitarios en `tests/unit/`: importan el módulo real (`../../js/utils/prioridad.js`) y corren en
  Node. Nada de DOM.
- E2E en `tests/e2e/`: usan el arnés de `tests/soporte/app.js`.
- Tablas de decisión como bucle de `test(...)`: un test por fila, con la fila en el título.

## Arnés (`tests/soporte/app.js`)

| Función | Para qué |
|---|---|
| `abrir(page, "#/ticket/SVD-4102")` | Navega y espera a que la pantalla esté pintada |
| `fila(page, id)` | La fila de un ticket en la bandeja |
| `aceptar(page, id)` / `corregir(page, id, { Categoría, Urgencia, Impacto })` | Flujos completos desde la ficha |
| `exportar(page)` → `{ nombre, datos }` | Pulsa Exportar y lee el JSON descargado |
| `leerTriaje(page)` | Lo que la app dejó en `svd-triaje` |
| `sembrarTriaje(page, objeto)` | Estado previo en `svd-triaje`, **solo en la primera carga** |
| `datasetReal()` + `servirDataset(page, tickets)` | Dataset alterado sin tocar el archivo |

## Selectores

- Botones por rol y nombre: `page.getByRole("button", { name: "Aceptar" })`.
- Desplegables de filtros (tienen `aria-label`) y de Corregir (van dentro de su `<label>`):
  `page.getByLabel("Estado del triaje")`, `page.getByLabel("Urgencia")`.
- Filas: `fila(page, "SVD-4102")` (atributo `data-id`).
- Clases CSS solo cuando significan algo del spec (`.fila-ticket--destacada`,
  `.fila-ticket__motivo--aviso`, `.cabecera__aviso`).
- **Trampa:** `locator(".panel", { hasText: "Revisados" })` también coincidía con la nota
  "… / 2 revisados" de otra tarjeta. Filtra por el título exacto:
  `.filter({ has: page.locator(".panel__titulo").getByText("Revisados", { exact: true }) })`.

## Recetas

**Dataset alterado** (casos límite, sugerencia regenerada, JSON reimportado con `triaje`):

```js
const tickets = datasetReal();
tickets.find((t) => t.id === "SVD-4102").sugerencia.urgencia = "Baja"; // brecha no-Alta
await servirDataset(page, tickets);
await abrir(page);
```

**Estado previo en localStorage:** `sembrarTriaje(page, { "SVD-4102": { estado: "Confirmado", … } })`.
**Trampa:** `addInitScript` se ejecuta en cada recarga; por eso el arnés siembra una sola vez por
pestaña. Si no, los tests de persistencia miden el arnés y no la app.

**localStorage bloqueado:**

```js
await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("x", "QuotaExceededError"); }; });
```

**Cerrar la pestaña con cambios sin exportar:**

```js
const dialogo = page.waitForEvent("dialog");
await page.close({ runBeforeUnload: true });
expect((await dialogo).type()).toBe("beforeunload");
```

**Reloj y zona horaria** (valores límite de fecha):

```js
test.use({ timezoneId: "Europe/Madrid" });
await page.clock.setFixedTime(new Date("2026-09-23T22:30:00Z")); // 00:30 en Madrid
```

**Peticiones al exterior:** `page.on("request", …)` y comprobar que todas empiezan por `baseURL`
(`blob:` y `data:` no son red).

**Contraste WCAG:** ver `textosSinContraste()` en `tests/e2e/accesibilidad.spec.js`.
**Trampa:** `rgb(r, g, b)` no trae alfa y es opaco; tratarlo como transparente midió todo contra
blanco y dio decenas de falsos rojos en el tema oscuro.

**Cobertura:** ver `tests/e2e/cobertura.spec.js`. **Trampa:** cada `page.goto` crea un documento
nuevo y Chromium descarta los contadores del anterior, aunque se pida `resetOnNavigation: false`.
Navega por hash dentro de la página y recoge (`stopJSCoverage`) antes de cada recarga.

**Análisis estático:** ver `tests/unit/constitucion.spec.js`. **Trampa:** quita los comentarios
antes de buscar usos (`localStorage` aparecía en comentarios que decían "no toca localStorage").

**Regresión visual:** `await expect(page).toHaveScreenshot("nombre.png", { maxDiffPixelRatio: 0.01 })`.
Las referencias llevan sufijo del sistema (`-win32`); en otro sistema, `npm run test:capturas`.

## Servidor de pruebas

`playwright.config.js` arranca `tests/soporte/servidor.py`: el `http.server` de Python en `127.0.0.1:8000` con cola de 128
conexiones. **Trampa:** con la cola por defecto (5) y 8 navegadores en paralelo, Windows rechazaba
conexiones (`ERR_CONNECTION_REFUSED`) de forma intermitente.

## Mutación manual (comprobar que la suite detecta bugs)

Sin Stryker (sería otra dependencia): cambia a mano una línea del código por un bug plausible
(una celda de la matriz, una comparación invertida, `textContent` → `innerHTML`), ejecuta
`npm test`, comprueba que falla al menos un test por el motivo correcto, y **restaura el archivo**.
Hazlo desde un script que restaure en un `finally`, nunca a mano sobre archivos con cambios sin
commitear. **Trampa:** en Windows, `Path.write_text()` de Python convierte los saltos de línea a
CRLF y el archivo "restaurado" sale como modificado en git. Escribe con
`open(ruta, "w", encoding="utf-8", newline="")` y comprueba al final con
`git diff --ignore-cr-at-eol --stat -- js/` que solo quedan los cambios que querías.

## Depurar un fallo

1. Lee `test-results/<test>/error-context.md`: trae el error y una instantánea de la página.
2. `npx playwright show-trace test-results/<test>/trace.zip` para ver paso a paso.
3. Antes de tocar nada, decide contra el spec: ¿falla la app o falla el test?
