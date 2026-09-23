// Nivel: sistema (e2e). Característica ISO/IEC 25010: seguridad y conformidad con la constitución.
// Base de prueba: constitución P2 (ninguna petición a un host externo) y P6 (funciona sin conexión).
import { test, expect } from "@playwright/test";
import { abrir, aceptar, corregir, exportar } from "../soporte/app.js";

test.describe("P2 · la app no habla con nadie de fuera", { tag: ["@P2", "@seguridad", "@humo"] }, () => {
  test("en un recorrido completo, todas las peticiones son al propio origen", async ({ page, baseURL }) => {
    const externas = [];
    page.on("request", (r) => {
      const url = r.url();
      if (!url.startsWith(baseURL) && !url.startsWith("blob:") && !url.startsWith("data:")) externas.push(url);
    });

    await abrir(page);
    await aceptar(page, "SVD-4102");
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await abrir(page, "#/metricas");
    await page.getByRole("button", { name: /Tema/ }).click();
    await abrir(page);
    await exportar(page);

    expect(externas).toEqual([]);
  });
});

test.describe("P6 · funciona sin conexión", { tag: ["@P6", "@CF8"] }, () => {
  test("con la red cortada a todo lo que no sea el propio servidor, la bandeja carga entera", async ({ page, baseURL }) => {
    await page.route(/.*/, (ruta) => (ruta.request().url().startsWith(baseURL) ? ruta.continue() : ruta.abort()));
    await abrir(page);
    await expect(page.locator(".fila-ticket")).toHaveCount(60);
  });
});
