// Nivel: aceptación (ISTQB) — pruebas de aceptación automatizadas (ATDD), una por historia de
// usuario de docs/spec.md, escritas como Dado / Cuando / Entonces. No sustituyen la UAT con una
// persona real, que está en docs/pruebas/uat.md: comprueban que cada historia se puede cumplir.
import { test, expect } from "@playwright/test";
import { abrir, aceptar, anadirNota, corregir, exportar, fila, leerTriaje, MOTIVO_CORRECCION } from "../soporte/app.js";

test.describe("Aceptación · historias de usuario", { tag: ["@aceptacion"] }, () => {
  test("H1 · veo categoría, prioridad sugeridas y el motivo sin abrir la ficha", { tag: ["@humo", "@R4", "@P4"] }, async ({ page }) => {
    await test.step("Dado que abro la bandeja", () => abrir(page));
    const f = fila(page, "SVD-4102");
    await test.step("Entonces cada fila muestra categoría y prioridad marcadas como sugeridas y el motivo", async () => {
      await expect(f).toContainText("Brecha de seguridad activa · sugerido");
      await expect(f).toContainText("Crítica · sugerido");
      await expect(f.locator(".fila-ticket__motivo")).toContainText("Motivo IA:");
    });
  });

  test("H2 · acepto una sugerencia con un clic", { tag: ["@humo", "@R5"] }, async ({ page }) => {
    await test.step("Dado que estoy en la ficha de un ticket pendiente", () => abrir(page, "#/ticket/SVD-4102"));
    await test.step("Cuando pulso Aceptar una sola vez", () => page.getByRole("button", { name: "Aceptar" }).click());
    await test.step("Entonces queda Confirmado con los valores sugeridos", async () => {
      expect((await leerTriaje(page))["SVD-4102"]).toMatchObject({ estado: "Confirmado", urgencia: "Alta", impacto: "Alto" });
    });
  });

  test("H3 · corrijo categoría, urgencia o impacto y mandan mi criterio y la matriz", { tag: ["@R5", "@P5"] }, async ({ page }) => {
    await test.step("Dado un ticket sugerido como Media × Alto (prioridad Alta)", () => abrir(page, "#/ticket/SVD-4104/corregir"));
    await test.step("Cuando subo la urgencia a Alta y guardo", async () => {
      await page.getByLabel("Urgencia").selectOption("Alta");
      await page.getByLabel("Motivo de la corrección").fill(MOTIVO_CORRECCION);
      await page.getByRole("button", { name: "Guardar corrección" }).click();
    });
    await test.step("Entonces queda Corregido y su prioridad es la de la matriz: Crítica", async () => {
      await page.getByLabel("Estado del triaje").selectOption("todos");
      await expect(fila(page, "SVD-4104")).toContainText("Corregido");
      await expect(fila(page, "SVD-4104")).toContainText("Crítica");
    });
  });

  test("H4 · veo primero los pendientes y los Sin clasificar", { tag: ["@R4"] }, async ({ page }) => {
    await test.step("Dado que ya confirmé un ticket", () => aceptar(page, "SVD-4102"));
    await test.step("Cuando miro la bandeja por defecto", () => abrir(page));
    await test.step("Entonces arriba están los Sin clasificar y el confirmado no aparece", async () => {
      await expect(page.locator(".fila-ticket").first()).toHaveClass(/fila-ticket--destacada/);
      await expect(fila(page, "SVD-4102")).toHaveCount(0);
    });
  });

  test("H5 · exporto lo que confirmé para que quede en el repo", { tag: ["@R6", "@CF5"] }, async ({ page }) => {
    await test.step("Dado que confirmé un ticket", () => aceptar(page, "SVD-4102"));
    const { nombre, datos } = await test.step("Cuando pulso Exportar", () => exportar(page));
    await test.step("Entonces descargo un JSON con los 60 tickets y mi confirmación dentro", async () => {
      expect(nombre).toMatch(/^tickets-triaje-\d{4}-\d{2}-\d{2}\.json$/);
      expect(datos).toHaveLength(60);
      expect(datos.find((t) => t.id === "SVD-4102").triaje.estado).toBe("Confirmado");
    });
  });

  test("H6 · me avisa si cierro la pestaña con trabajo sin exportar", { tag: ["@R6"] }, async ({ page }) => {
    await test.step("Dado que confirmé un ticket y no he exportado", () => aceptar(page, "SVD-4102"));
    const dialogo = page.waitForEvent("dialog");
    await test.step("Cuando intento cerrar la pestaña", () => page.close({ runBeforeUnload: true }));
    await test.step("Entonces el navegador me pide confirmación", async () => {
      expect((await dialogo).type()).toBe("beforeunload");
    });
  });

  test("H7 · como responsable, sé cuántas sugerencias se aceptaron y cuántas se corrigieron", { tag: ["@R7"] }, async ({ page }) => {
    await test.step("Dado un ticket aceptado y otro corregido", async () => {
      await aceptar(page, "SVD-4102");
      await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    });
    await test.step("Cuando abro las métricas", () => abrir(page, "#/metricas"));
    await test.step("Entonces veo 1 confirmado, 1 corregido y una tasa de corrección del 50 %", async () => {
      await expect(page.getByText("1 confirmados · 1 corregidos")).toBeVisible();
      const tasa = page.locator(".panel").filter({ has: page.locator(".panel__titulo").getByText("Tasa de corrección", { exact: true }) });
      await expect(tasa.locator(".kpi__valor")).toHaveText("50%");
    });
  });

  test("H8 · explico por qué corrijo a la IA", { tag: ["@R9", "@R5"] }, async ({ page }) => {
    await test.step("Dado un ticket que corrijo", async () => {
      await abrir(page, "#/ticket/SVD-4104/corregir");
      await page.getByLabel("Urgencia").selectOption("Alta");
    });
    await test.step("Cuando escribo el motivo y guardo", async () => {
      await page.getByLabel("Motivo de la corrección").fill("El lector ya no valida a nadie en el turno de noche.");
      await page.getByRole("button", { name: "Guardar corrección" }).click();
    });
    await test.step("Entonces la ficha enseña mi motivo junto a lo que sugirió la IA", async () => {
      await abrir(page, "#/ticket/SVD-4104");
      await expect(page.locator(".caja-ia")).toContainText("Sugerencia original de la IA");
      await expect(page.locator(".caja-ia")).toContainText("El lector ya no valida a nadie en el turno de noche.");
    });
  });

  test("H9 · añado notas a un ticket sin tocar lo que se reportó", { tag: ["@R9"] }, async ({ page }) => {
    await test.step("Dado un ticket abierto en su ficha", () => abrir(page, "#/ticket/SVD-4104"));
    const descripcion = await page.locator(".panel").first().textContent();
    await test.step("Cuando añado una nota", () => anadirNota(page, "Mantenimiento pasará el jueves (nota inventada)."));
    await test.step("Entonces la nota queda con su fecha y la descripción original no cambia", async () => {
      await expect(page.locator(".notas__texto")).toHaveText(["Mantenimiento pasará el jueves (nota inventada)."]);
      await expect(page.locator(".panel").first()).toHaveText(descripcion);
    });
  });
});
