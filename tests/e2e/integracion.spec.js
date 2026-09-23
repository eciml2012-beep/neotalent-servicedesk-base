// Nivel: integración de sistemas (ISTQB) — el contrato de ida y vuelta de spec R6 ("cómo vuelve el
// export al repo", decisión A6): lo que la app exporta, puesto en lugar de data/tickets.json, lo
// vuelve a leer otra sesión sin perder nada. Y el contrato con Claude Code: el JSON que escribe
// es el que la app sabe leer.
import { test, expect } from "@playwright/test";
import { abrir, aceptar, corregir, exportar, fila, datasetReal, servirDataset, leerTriaje } from "../soporte/app.js";

test.describe("Integración · export → repo → otra sesión", { tag: ["@integracion", "@R6", "@CF5"] }, () => {
  test("lo exportado, reimportado en un navegador limpio, conserva cada confirmación", async ({ page, browser }) => {
    await aceptar(page, "SVD-4102");
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await corregir(page, "SVD-4143", { Categoría: "Equipo de campo averiado" });
    const { datos } = await exportar(page);

    // Otra persona, otro navegador: sin localStorage, con el archivo exportado como data/tickets.json.
    const otro = await (await browser.newContext({ baseURL: test.info().project.use.baseURL })).newPage();
    await servirDataset(otro, datos);
    await abrir(otro);
    await otro.getByLabel("Estado del triaje").selectOption("todos");

    await expect(fila(otro, "SVD-4102")).toContainText("Confirmado");
    await expect(fila(otro, "SVD-4104")).toContainText("Corregido");
    await expect(fila(otro, "SVD-4104")).toContainText("Crítica");
    await expect(fila(otro, "SVD-4143")).toContainText("Equipo de campo averiado");
    await otro.getByLabel("Estado del triaje").selectOption("pendientes");
    await expect(otro.locator(".fila-ticket")).toHaveCount(57);
    await otro.context().close();
  });

  test("exportar, reimportar y volver a exportar da el mismo archivo (idempotente)", async ({ page, browser }) => {
    await aceptar(page, "SVD-4102");
    const primero = (await exportar(page)).datos;

    const otro = await (await browser.newContext({ baseURL: test.info().project.use.baseURL })).newPage();
    await servirDataset(otro, primero);
    await abrir(otro);
    const segundo = (await exportar(otro)).datos;
    await otro.context().close();

    expect(segundo).toEqual(primero);
  });

  test("una confirmación hecha después de reimportar convive con las del archivo", async ({ page, browser }) => {
    await aceptar(page, "SVD-4102");
    const { datos } = await exportar(page);

    const otro = await (await browser.newContext({ baseURL: test.info().project.use.baseURL })).newPage();
    await servirDataset(otro, datos);
    await aceptar(otro, "SVD-4117");
    const triaje = await leerTriaje(otro);
    await otro.context().close();

    expect(triaje["SVD-4102"].estado).toBe("Confirmado"); // viene del archivo
    expect(triaje["SVD-4117"].estado).toBe("Confirmado"); // hecha en esta sesión
  });
});

test.describe("Integración · contrato con Claude Code", { tag: ["@integracion", "@R1"] }, () => {
  test("el dataset que escribe Claude Code se pinta entero sin ninguna sugerencia descartada", async ({ page }) => {
    await servirDataset(page, datasetReal());
    await abrir(page);
    await expect(page.locator(".fila-ticket")).toHaveCount(60);
    await expect(page.locator(".fila-ticket__motivo--aviso")).toHaveCount(0);
  });
});
