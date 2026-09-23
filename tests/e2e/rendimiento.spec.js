// Nivel: sistema (e2e). Característica ISO/IEC 25010: eficiencia de desempeño → comportamiento
// temporal. Presupuestos holgados a propósito (x5-x10 lo medido): detectan una regresión grave sin
// dar falsos fallos en un portátil lento. El spec no fija tiempos: son decisión propia, declarada.
import { test, expect } from "@playwright/test";
import { abrir } from "../soporte/app.js";

test.describe("Rendimiento · presupuestos de tiempo", { tag: ["@rendimiento"] }, () => {
  test("la bandeja con los 60 tickets está pintada en menos de 2 s", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => document.querySelectorAll(".fila-ticket").length === 60);
    const ms = await page.evaluate(() => performance.now());
    expect(ms).toBeLessThan(2000);
  });

  test("cambiar un filtro repinta la bandeja en menos de 100 ms", async ({ page }) => {
    await abrir(page);
    const ms = await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Prioridad"]');
      const t0 = performance.now();
      select.value = "Crítica";
      select.dispatchEvent(new Event("change"));
      return performance.now() - t0;
    });
    expect(ms).toBeLessThan(100);
  });

  test("abrir una ficha tarda menos de 100 ms", async ({ page }) => {
    await abrir(page);
    const ms = await page.evaluate(() => {
      const t0 = performance.now();
      location.hash = "#/ticket/SVD-4102";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return performance.now() - t0;
    });
    expect(ms).toBeLessThan(100);
  });
});
