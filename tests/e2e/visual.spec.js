// Nivel: sistema (e2e). Tipo: regresión visual. Compara cada pantalla con una captura de referencia
// guardada en visual.spec.js-snapshots/. Las referencias son del sistema operativo donde se generaron
// (sufijo -win32): en otro sistema hay que regenerarlas con `npm run test:capturas`.
// Una captura de referencia nueva NO está aprobada hasta que una persona la mira (docs/pruebas/uat.md).
import { test, expect } from "@playwright/test";
import { abrir } from "../soporte/app.js";

const PANTALLAS = [
  ["bandeja", "#/bandeja"],
  ["ficha-pendiente", "#/ticket/SVD-4102"],
  ["ficha-sin-clasificar", "#/ticket/SVD-4143"],
  ["corregir", "#/ticket/SVD-4104/corregir"],
  ["metricas", "#/metricas"],
];

for (const tema of ["claro", "oscuro"]) {
  test.describe(`Regresión visual · tema ${tema}`, { tag: ["@visual"] }, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("svd-tema", t), tema);
    });
    for (const [nombre, hash] of PANTALLAS) {
      test(nombre, async ({ page }) => {
        await abrir(page, hash);
        await expect(page).toHaveScreenshot(`${nombre}-${tema}.png`, { maxDiffPixelRatio: 0.01 });
      });
    }
  });
}

test.describe("Regresión visual · móvil", { tag: ["@visual"] }, () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("bandeja en un móvil", async ({ page }) => {
    await abrir(page);
    await expect(page).toHaveScreenshot("bandeja-movil.png", { maxDiffPixelRatio: 0.01 });
  });
});
