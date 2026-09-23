// Nivel: sistema (e2e). Base de prueba: spec R4, decisión 4 y 9, criterio 7; constitución P1 y P4.
import { test, expect } from "@playwright/test";
import { abrir, aceptar, fila } from "../soporte/app.js";

const SIN_CLASIFICAR = ["SVD-4113", "SVD-4128", "SVD-4143", "SVD-4158"];
const RANGO = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };

test.describe("R4 · bandeja", { tag: ["@R4"] }, () => {
  test("abre con los 60 tickets pendientes de confirmar", { tag: "@humo" }, async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole("heading", { name: "Bandeja de triaje" })).toBeVisible();
    await expect(page.locator(".fila-ticket")).toHaveCount(60);
    await expect(page.getByLabel("Estado del triaje")).toHaveValue("pendientes");
  });

  test("cada fila enseña id, título, categoría, prioridad, motivo y estado sin abrir la ficha (P4)", async ({ page }) => {
    await abrir(page);
    const f = fila(page, "SVD-4102");
    await expect(f).toContainText("SVD-4102");
    await expect(f).toContainText("Alarma perimetral desactivada tras mantenimiento en Perímetro exterior");
    await expect(f).toContainText("Brecha de seguridad activa · sugerido");
    await expect(f).toContainText("Crítica · sugerido");
    await expect(f.locator(".fila-ticket__motivo")).toContainText("Motivo IA: La alarma perimetral");
    await expect(f).toContainText("Pendiente de confirmar");
  });

  test("orden: Sin clasificar primero y luego prioridad de Crítica a Baja", async ({ page }) => {
    await abrir(page);
    const ids = await page.locator(".fila-ticket").evaluateAll((filas) => filas.map((f) => f.dataset.id));
    expect(ids.slice(0, 4).sort()).toEqual(SIN_CLASIFICAR);

    const prioridades = await page.locator(".fila-ticket").evaluateAll((filas) =>
      filas.slice(4).map((f) => f.children[3].textContent.replace(" · sugerido", "").trim())
    );
    const rangos = prioridades.map((p) => RANGO[p]);
    expect(rangos).toEqual([...rangos].sort((a, b) => a - b));
  });

  test("los 10 tickets cerrados salen en Pendientes de confirmar (decisión 9, criterio 7)", { tag: "@CF7" }, async ({ page }) => {
    await abrir(page);
    await expect(page.locator(".fila-ticket .fila-ticket__cerrado")).toHaveCount(10);
  });

  test("los Sin clasificar salen destacados y sin prioridad (decisión 4)", async ({ page }) => {
    await abrir(page);
    await expect(page.locator(".fila-ticket--destacada")).toHaveCount(4);
    for (const id of SIN_CLASIFICAR) await expect(fila(page, id)).toContainText("— sin prioridad");
  });

  test("sugerido y confirmado se distinguen por algo más que el color (C2, P1)", async ({ page }) => {
    await abrir(page);
    const badge = fila(page, "SVD-4102").locator(".badge").first();
    await expect(badge).toHaveCSS("border-top-style", "dashed");

    await aceptar(page, "SVD-4102");
    await page.getByLabel("Estado del triaje").selectOption("todos");
    const confirmado = fila(page, "SVD-4102").locator(".badge").first();
    await expect(confirmado).toHaveCSS("border-top-style", "solid");
    await expect(confirmado).not.toContainText("sugerido");
  });

  test("un confirmado sale de Pendientes y va al final en Todos", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await expect(page.locator(".fila-ticket")).toHaveCount(59);
    await expect(fila(page, "SVD-4102")).toHaveCount(0);
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await expect(page.locator(".fila-ticket").last()).toHaveAttribute("data-id", "SVD-4102");
  });
});

test.describe("R4 · filtros", { tag: ["@R4"] }, () => {
  test("por prioridad: Crítica deja los 5 críticos", async ({ page }) => {
    await abrir(page);
    await page.getByLabel("Prioridad").selectOption("Crítica");
    await expect(page.locator(".fila-ticket")).toHaveCount(5);
    for (const f of await page.locator(".fila-ticket").all()) await expect(f).toContainText("Crítica");
  });

  test("por estado del ticket: cerrados", async ({ page }) => {
    await abrir(page);
    await page.getByLabel("Estado del ticket").selectOption("cerrado");
    await expect(page.locator(".fila-ticket")).toHaveCount(10);
  });

  test("por zona y sistema a la vez (Y lógico)", async ({ page }) => {
    await abrir(page);
    await page.getByLabel("Zona").selectOption("Perímetro exterior");
    await page.getByLabel("Sistema afectado").selectOption("Central de alarmas");
    const ids = await page.locator(".fila-ticket").evaluateAll((f) => f.map((x) => x.dataset.id).sort());
    expect(ids).toEqual(["SVD-4102", "SVD-4117"]);
  });

  test("por estado del triaje: Confirmados y Corregidos", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await page.getByLabel("Estado del triaje").selectOption("Confirmado");
    await expect(page.locator(".fila-ticket")).toHaveCount(1);
    await page.getByLabel("Estado del triaje").selectOption("Corregido");
    await expect(page.locator(".fila-ticket")).toHaveCount(0);
    await expect(page.getByText("Ningún ticket coincide con estos filtros.")).toBeVisible();
  });

  test("abrir una fila lleva a su ficha y «← Bandeja» vuelve", async ({ page }) => {
    await abrir(page);
    await fila(page, "SVD-4102").click();
    await expect(page).toHaveURL(/#\/ticket\/SVD-4102$/);
    await page.getByRole("button", { name: "← Bandeja" }).click();
    await expect(page).toHaveURL(/#\/bandeja$/);
  });
});
