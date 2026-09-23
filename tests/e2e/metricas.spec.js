// Nivel: sistema (e2e). Base de prueba: spec R7 (y su precisión del QA de la Fase 3).
import { test, expect } from "@playwright/test";
import { abrir, aceptar, corregir } from "../soporte/app.js";

// Por el título exacto de la tarjeta: "Revisados" también aparece en la nota "… / 2 revisados".
const kpi = (page, titulo) =>
  page.locator(".panel").filter({ has: page.locator(".panel__titulo").getByText(titulo, { exact: true }) }).locator(".kpi__valor");
const barra = (page, etiqueta) => page.locator(".barra-metrica").filter({ has: page.getByText(etiqueta, { exact: true }) });

test.describe("R7 · panel de métricas", { tag: ["@R7"] }, () => {
  test("de entrada: 60 pendientes, sin revisados y la tasa sin valor (no 0 %)", async ({ page }) => {
    await abrir(page, "#/metricas");
    await expect(page.getByRole("link", { name: "Métricas" })).toHaveAttribute("aria-current", "page");
    await expect(kpi(page, "Pendientes de confirmar")).toHaveText("60");
    await expect(kpi(page, "Revisados")).toHaveText("0");
    await expect(kpi(page, "Tasa de corrección")).toHaveText("—");
  });

  test("tickets por prioridad: 5 Crítica, 16 Alta, 22 Media, 13 Baja", async ({ page }) => {
    await abrir(page, "#/metricas");
    const esperado = { Crítica: "5", Alta: "16", Media: "22", Baja: "13" };
    for (const [nivel, n] of Object.entries(esperado)) {
      await expect(barra(page, nivel).locator(".barra-metrica__numero")).toHaveText(n);
    }
  });

  test("tasa de corrección global y por la categoría que sugirió la IA", async ({ page }) => {
    await aceptar(page, "SVD-4119"); // IA: Equipo de campo averiado → se acepta
    await corregir(page, "SVD-4104", { Categoría: "Brecha de seguridad activa" }); // IA: Equipo averiado → corregido
    await abrir(page, "#/metricas");
    await expect(kpi(page, "Revisados")).toHaveText("2");
    await expect(kpi(page, "Tasa de corrección")).toHaveText("50%");
    await expect(barra(page, "Equipo de campo averiado").locator(".barra-metrica__tasa")).toHaveText("50%");
    await expect(barra(page, "Brecha de seguridad activa").locator(".barra-metrica__tasa")).toHaveText("—");
  });

  test("el panel es solo lectura: no tiene ningún control que cambie datos", async ({ page }) => {
    await abrir(page, "#/metricas");
    await expect(page.locator("main button, main select, main input")).toHaveCount(0);
  });
});
