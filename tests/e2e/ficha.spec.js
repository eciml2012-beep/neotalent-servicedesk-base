// Nivel: sistema (e2e). Técnica: transición de estados del triaje + tabla de decisión R8 en la UI.
// Base de prueba: spec R5, R8 (interfaz), punto 13 de la 2ª revisión; constitución P1; diseno.md.
import { test, expect } from "@playwright/test";
import { abrir, aceptar, corregir, leerTriaje, MOTIVO_CORRECCION } from "../soporte/app.js";

test.describe("R5 · ficha en modo ver", { tag: ["@R5"] }, () => {
  test("la sugerencia va dentro de su caja y las acciones de la persona fuera (P1, diseno.md)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4102");
    await expect(page.locator(".caja-ia")).toContainText("sin confirmar");
    await expect(page.locator(".caja-ia")).toContainText("Crítica");
    await expect(page.locator(".caja-ia button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Aceptar" })).toBeVisible();
    await expect(page.getByText("Perímetro exterior (zona crítica)")).toBeVisible();
  });

  test("Deshacer está deshabilitado mientras no hay nada que deshacer", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4102");
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();
  });

  test("Aceptar guarda la sugerencia tal cual como Confirmado", { tag: "@humo" }, async ({ page }) => {
    await aceptar(page, "SVD-4102");
    const t = (await leerTriaje(page))["SVD-4102"];
    expect(t).toMatchObject({ estado: "Confirmado", categoria: "Brecha de seguridad activa", urgencia: "Alta", impacto: "Alto" });
    expect(t.fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("un Sin clasificar no tiene botón Aceptar (R4: nunca Sin clasificar + Confirmado)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4143");
    await expect(page.getByRole("button", { name: "Aceptar" })).toHaveCount(0);
    await expect(page.getByText("Sin botón Aceptar")).toBeVisible();
  });

  test("no existe ningún «aceptar todo» en ninguna pantalla (P1)", async ({ page }) => {
    for (const hash of ["#/bandeja", "#/ticket/SVD-4102", "#/metricas"]) {
      await abrir(page, hash);
      await expect(page.getByRole("button", { name: /todo|todos|masiv/i })).toHaveCount(0);
    }
  });
});

test.describe("R8 · el desplegable de urgencia en Corregir", { tag: ["@R8", "@R5"] }, () => {
  const casos = [
    ["Brecha de seguridad activa", ["Alta"], true],
    ["Petición de acceso", ["Baja"], true],
    ["Petición de información", ["Baja"], true],
    ["Falsa alarma recurrente", ["Media", "Baja"], false],
    ["Equipo de campo averiado", ["Alta", "Media", "Baja"], false],
    ["Pérdida de registro o evidencia", ["Alta", "Media", "Baja"], false],
    ["Fallo de integración entre sistemas", ["Alta", "Media", "Baja"], false],
  ];
  for (const [categoria, opciones, fijada] of casos) {
    test(`${categoria}: ${fijada ? `fijada en ${opciones[0]}` : opciones.join(", ")}`, async ({ page }) => {
      await abrir(page, "#/ticket/SVD-4104/corregir");
      await page.getByLabel("Categoría").selectOption(categoria);
      const urgencia = page.getByLabel("Urgencia");
      await expect(urgencia.locator("option")).toHaveText(opciones);
      if (fijada) await expect(urgencia).toBeDisabled();
      else await expect(urgencia).toBeEnabled();
    });
  }

  test("la urgencia fijada explica por qué", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Categoría").selectOption("Brecha de seguridad activa");
    await expect(page.getByText("es siempre urgencia Alta")).toBeVisible();
  });
});

test.describe("R5 · corregir, guardar y deshacer", { tag: ["@R5"] }, () => {
  test("la prioridad se recalcula al momento con la matriz (P5)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir"); // Media × Alto = Alta
    await expect(page.getByText("Prioridad recalculada: Alta")).toBeVisible();
    await page.getByLabel("Urgencia").selectOption("Alta");
    await expect(page.getByText("Prioridad recalculada: Crítica")).toBeVisible();
  });

  test("cambiar un campo → Corregido; reabrir y guardar sin tocar → sigue Corregido", { tag: "@R7" }, async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    expect((await leerTriaje(page))["SVD-4104"].estado).toBe("Corregido");
    await corregir(page, "SVD-4104");
    expect((await leerTriaje(page))["SVD-4104"].estado).toBe("Corregido");
  });

  test("guardar un pendiente sin tocar nada → Confirmado (decisión 15)", async ({ page }) => {
    await corregir(page, "SVD-4119");
    expect((await leerTriaje(page))["SVD-4119"].estado).toBe("Confirmado");
  });

  test("corregir a Sin clasificar deja urgencia e impacto en null y cuenta como Corregido", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Categoría").selectOption("Sin clasificar");
    await expect(page.getByLabel("Urgencia")).toBeDisabled();
    await expect(page.getByLabel("Impacto")).toBeDisabled();
    await page.getByLabel("Motivo de la corrección").fill(MOTIVO_CORRECCION);
    await page.getByRole("button", { name: "Guardar corrección" }).click();
    expect((await leerTriaje(page))["SVD-4104"]).toMatchObject({ estado: "Corregido", categoria: "Sin clasificar", urgencia: null, impacto: null });
  });

  test("un Sin clasificar que se deja como Sin clasificar no se puede guardar", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4143/corregir");
    await page.getByLabel("Categoría").selectOption("Sin clasificar");
    await expect(page.getByRole("button", { name: "Guardar corrección" })).toBeDisabled();
  });

  test("clasificar un Sin clasificar parte de urgencia e impacto válidos y queda Corregido", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4143/corregir"); // Nave logística 2: no es zona crítica
    await expect(page.getByLabel("Urgencia")).toHaveValue("Alta");
    await expect(page.getByLabel("Impacto")).toHaveValue("Medio");
    await page.getByLabel("Categoría").selectOption("Equipo de campo averiado");
    await page.getByLabel("Motivo de la corrección").fill(MOTIVO_CORRECCION);
    await page.getByRole("button", { name: "Guardar corrección" }).click();
    expect((await leerTriaje(page))["SVD-4143"]).toMatchObject({ estado: "Corregido", categoria: "Equipo de campo averiado", impacto: "Medio" });
  });

  test("ida y vuelta por Sin clasificar no deja el impacto en null (bug de la Fase 3)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Categoría").selectOption("Sin clasificar");
    await page.getByLabel("Categoría").selectOption("Equipo de campo averiado");
    await page.getByLabel("Motivo de la corrección").fill(MOTIVO_CORRECCION);
    await page.getByRole("button", { name: "Guardar corrección" }).click();
    expect((await leerTriaje(page))["SVD-4104"].impacto).toBe("Alto");
  });

  test("Cancelar vuelve a la ficha sin guardar", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Urgencia").selectOption("Alta");
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page).toHaveURL(/#\/ticket\/SVD-4104$/);
    expect(await leerTriaje(page)).not.toHaveProperty("SVD-4104");
  });

  test("Deshacer tras Aceptar y tras Corregir devuelve a Pendiente con la sugerencia original", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await abrir(page, "#/ticket/SVD-4102");
    await page.getByRole("button", { name: "Deshacer" }).click();
    expect(await leerTriaje(page)).not.toHaveProperty("SVD-4102");

    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await abrir(page, "#/ticket/SVD-4104");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await abrir(page, "#/ticket/SVD-4104");
    await expect(page.locator(".caja-ia")).toContainText("sin confirmar");
    await expect(page.locator(".caja-ia")).toContainText("Media");
  });

  test("la ficha de un Corregido enseña también lo que sugirió la IA (P1)", async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await abrir(page, "#/ticket/SVD-4104");
    await expect(page.getByText("Sugerencia original de la IA")).toBeVisible();
    await expect(page.locator(".caja-ia")).toContainText("Equipo de campo averiado · Media · Alto");
  });
});
