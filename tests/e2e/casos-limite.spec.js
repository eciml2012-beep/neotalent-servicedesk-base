// Nivel: sistema (e2e). Técnica: casos límite del spec (error guessing dirigido), con un dataset
// alterado que se sirve con page.route: data/tickets.json no se toca nunca.
// Base de prueba: spec "Casos límite", R8, criterio 6; constitución P4; OWASP (salida como texto).
import { test, expect } from "@playwright/test";
import { abrir, datasetReal, fila, servirDataset } from "../soporte/app.js";

const MOTIVO = "Motivo inventado para la prueba, con más de cuarenta caracteres.";

/** Dataset real con sugerencias rotas a propósito en tickets concretos. */
function datasetRoto() {
  const t = datasetReal();
  const por = (id) => t.find((x) => x.id === id);
  delete por("SVD-4100").sugerencia; // sin sugerencia
  por("SVD-4101").sugerencia = { categoria: "Robo", urgencia: "Media", impacto: "Medio", motivo: MOTIVO }; // fuera del enum
  por("SVD-4102").sugerencia = { ...por("SVD-4102").sugerencia, urgencia: "Baja" }; // brecha no-Alta (R8)
  por("SVD-4103").sugerencia = { ...por("SVD-4103").sugerencia, motivo: "" }; // motivo vacío (P4)
  por("SVD-4105").sugerencia = { categoria: "Sin clasificar", urgencia: "Alta", impacto: "Alto", motivo: MOTIVO }; // nulos no nulos
  return t;
}

test.describe("Casos límite · sugerencias inválidas", { tag: ["@CL", "@R8", "@CF6"] }, () => {
  test.beforeEach(async ({ page }) => {
    await servirDataset(page, datasetRoto());
    await abrir(page);
  });

  test("la bandeja no se rompe: siguen los 60", async ({ page }) => {
    await expect(page.locator(".fila-ticket")).toHaveCount(60);
  });

  test("sin campo sugerencia → Sin clasificar sin aviso («no como error»)", async ({ page }) => {
    await expect(fila(page, "SVD-4100")).toContainText("Sin clasificar");
    await expect(fila(page, "SVD-4100").locator(".fila-ticket__motivo--aviso")).toHaveCount(0);
  });

  for (const [id, caso] of [["SVD-4101", "categoría fuera de las 7"], ["SVD-4102", "combinación imposible"], ["SVD-4103", "motivo vacío"]]) {
    test(`${caso} → Sin clasificar y aviso en la fila`, async ({ page }) => {
      await expect(fila(page, id)).toContainText("Sin clasificar");
      await expect(fila(page, id).locator(".fila-ticket__motivo")).toContainText("⚠ Sugerencia descartada");
    });
  }

  test("el motivo de una sugerencia descartada no se enseña como si fuera válido", async ({ page }) => {
    await expect(fila(page, "SVD-4102")).not.toContainText("La alarma perimetral de Perímetro exterior quedó desactivada");
  });

  test("Sin clasificar con urgencia/impacto no nulos → se ignoran, sin prioridad y sin aviso", async ({ page }) => {
    await expect(fila(page, "SVD-4105")).toContainText("— sin prioridad");
    await expect(fila(page, "SVD-4105").locator(".fila-ticket__motivo--aviso")).toHaveCount(0);
  });

  test("la ficha de una sugerencia descartada lo dice y no deja Aceptar", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4102");
    await expect(page.locator(".caja-ia")).toContainText("sugerencia descartada");
    await expect(page.getByRole("button", { name: "Aceptar" })).toHaveCount(0);
  });
});

test.describe("Casos límite · navegación", { tag: ["@CL"] }, () => {
  test("un id que no existe enseña un mensaje, no una pantalla rota", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-9999");
    await expect(page.getByText("No existe ningún ticket con id SVD-9999.")).toBeVisible();
  });

  test("una ruta desconocida lleva a la bandeja", async ({ page }) => {
    await abrir(page, "#/lo-que-sea");
    await expect(page.getByRole("heading", { name: "Bandeja de triaje" })).toBeVisible();
  });
});

test.describe("Seguridad · el texto del ticket se pinta como texto", { tag: ["@CL-html", "@seguridad"] }, () => {
  test("HTML y scripts en título, descripción y motivo no se ejecutan (XSS)", async ({ page }) => {
    const tickets = datasetReal();
    const t = tickets.find((x) => x.id === "SVD-4102");
    t.titulo = '<img src=x onerror="window.__xss=1">Título con HTML';
    t.descripcion = "<script>window.__xss=2</script>";
    t.sugerencia.motivo = '<b onmouseover="window.__xss=3">negrita</b> motivo largo de más de cuarenta caracteres';
    await servirDataset(page, tickets);

    await abrir(page);
    await expect(fila(page, "SVD-4102")).toContainText('<img src=x onerror="window.__xss=1">Título con HTML');
    await abrir(page, "#/ticket/SVD-4102");
    await expect(page.getByText("<script>window.__xss=2</script>")).toBeVisible();

    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    await expect(page.locator("main img, main script, main b")).toHaveCount(0);
  });
});
