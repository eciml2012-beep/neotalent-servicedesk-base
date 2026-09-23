// Nivel: sistema (e2e). Técnicas: transición de estados (exportado ↔ cambios sin exportar),
// valores límite (medianoche local), particiones (localStorage disponible / bloqueado).
// Base de prueba: spec R6, casos límite, criterios 4 y 5; constitución P2 y P5.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { abrir, aceptar, corregir, datasetReal, exportar, fila, leerTriaje, sembrarTriaje, servirDataset } from "../soporte/app.js";

const aviso = (page) => page.locator(".cabecera__aviso");

test.describe("R6 · localStorage", { tag: ["@R6"] }, () => {
  test("solo existen las dos claves del spec y nunca se guarda la prioridad (P5)", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await page.getByRole("button", { name: /Tema/ }).click();
    const claves = await page.evaluate(() => Object.keys(localStorage).sort());
    expect(claves).toEqual(["svd-tema", "svd-triaje"]);
    expect(JSON.stringify(await leerTriaje(page))).not.toContain("prioridad");
  });

  test("aceptar, corregir y deshacer sobreviven a recargar la página (criterio 4)", { tag: ["@CF4", "@humo"] }, async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await page.reload();
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await expect(fila(page, "SVD-4102")).toContainText("Confirmado");
    await expect(fila(page, "SVD-4104")).toContainText("Corregido");

    await abrir(page, "#/ticket/SVD-4104");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await page.reload();
    await expect(fila(page, "SVD-4104")).toContainText("Pendiente de confirmar");
  });

  test("el tema oscuro se recuerda al recargar", async ({ page }) => {
    await abrir(page);
    await page.getByRole("button", { name: "Tema: Claro" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-tema", "oscuro");
    await expect(page.getByRole("button", { name: "Tema: Oscuro" })).toBeVisible();
  });

  test("con localStorage bloqueado la app sigue funcionando y avisa de exportar", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("bloqueado", "QuotaExceededError");
      };
    });
    await abrir(page);
    await expect(page.getByText("Sin almacenamiento local: exporta antes de cerrar")).toBeVisible();
    await aceptar(page, "SVD-4102");
    await expect(page.locator(".fila-ticket")).toHaveCount(59);
  });

  test("si data/tickets.json no carga, la app lo dice en vez de quedarse en blanco", async ({ page }) => {
    await page.route("**/data/tickets.json", (r) => r.fulfill({ status: 500, body: "" }));
    await page.goto("/");
    await expect(page.getByText("No se ha podido cargar data/tickets.json.")).toBeVisible();
  });
});

test.describe("R6 · cambios sin exportar", { tag: ["@R6"] }, () => {
  test("aparece al confirmar, desaparece al exportar y vuelve al deshacer", async ({ page }) => {
    await abrir(page);
    await expect(aviso(page)).toHaveCount(0);
    await aceptar(page, "SVD-4102");
    await expect(aviso(page)).toHaveText("⚠ Hay cambios sin exportar");

    await exportar(page);
    await expect(aviso(page)).toHaveCount(0);
    await expect(page.locator(".cabecera__nota")).toContainText("Sin cambios pendientes · exportado");

    await abrir(page, "#/ticket/SVD-4102");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(aviso(page)).toBeVisible();
  });

  test("cerrar la pestaña con cambios sin exportar pide confirmación", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    const dialogo = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    expect((await dialogo).type()).toBe("beforeunload");
  });

  test("sin cambios, cerrar la pestaña no pide nada", async ({ page }) => {
    await abrir(page);
    let hubo = false;
    page.on("dialog", () => (hubo = true));
    await page.close({ runBeforeUnload: true });
    expect(hubo).toBe(false);
  });
});

test.describe("R6 · exportar", { tag: ["@R6", "@CF5"] }, () => {
  test("descarga los 60 tickets con sus campos originales intactos", { tag: "@humo" }, async ({ page }) => {
    await aceptar(page, "SVD-4102");
    const { datos } = await exportar(page);
    const original = datasetReal();
    expect(datos).toHaveLength(60);
    datos.forEach((t, i) => {
      const { triaje, notas, ...resto } = t;
      expect(resto, t.id).toEqual(original[i]);
      expect(notas, t.id).toEqual([]); // R9: la clave existe siempre
    });
  });

  test("los pendientes llevan triaje null y los revisados su valor final, sin prioridad", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    const { datos } = await exportar(page);
    const por = Object.fromEntries(datos.map((t) => [t.id, t.triaje]));
    expect(por["SVD-4100"]).toBeNull();
    expect(por["SVD-4102"]).toMatchObject({ estado: "Confirmado", urgencia: "Alta", impacto: "Alto" });
    expect(por["SVD-4104"]).toMatchObject({ estado: "Corregido", urgencia: "Alta" });
    expect(JSON.stringify(datos)).not.toContain('"prioridad"');
  });

  test("el nombre es tickets-triaje-AAAA-MM-DD.json", async ({ page }) => {
    await abrir(page);
    const { nombre } = await exportar(page);
    expect(nombre).toMatch(/^tickets-triaje-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test.describe("a medianoche", () => {
    test.use({ timezoneId: "Europe/Madrid" });
    test("la fecha del nombre es la del operador, no la UTC (valor límite)", async ({ page }) => {
      // 24/09/2026 00:30 en Madrid = 23/09/2026 22:30 UTC.
      await page.clock.setFixedTime(new Date("2026-09-23T22:30:00Z"));
      await abrir(page);
      const { nombre } = await exportar(page);
      expect(nombre).toBe("tickets-triaje-2026-09-24.json");
    });
  });

  test("exportar nunca escribe en data/tickets.json", async ({ page }) => {
    const antes = readFileSync(new URL("../../data/tickets.json", import.meta.url), "utf8");
    await aceptar(page, "SVD-4102");
    await exportar(page);
    expect(readFileSync(new URL("../../data/tickets.json", import.meta.url), "utf8")).toBe(antes);
  });
});

test.describe("R6 · sincronización con el JSON", { tag: ["@R6"] }, () => {
  test("si Claude Code cambia la sugerencia de un ticket confirmado, vuelve a Pendiente", async ({ page }) => {
    await sembrarTriaje(page, {
      "SVD-4102": {
        estado: "Confirmado", categoria: "Brecha de seguridad activa", urgencia: "Alta", impacto: "Alto",
        sugerenciaSnapshot: { categoria: "Brecha de seguridad activa", urgencia: "Alta", impacto: "Alto" },
        fecha: "2026-09-20T10:00:00.000Z",
      },
    });
    const tickets = datasetReal();
    tickets.find((t) => t.id === "SVD-4102").sugerencia = {
      categoria: "Equipo de campo averiado", urgencia: "Media", impacto: "Alto",
      motivo: "Sugerencia regenerada para la prueba, inventada, más de cuarenta caracteres.",
    };
    await servirDataset(page, tickets);
    await abrir(page);
    await expect(fila(page, "SVD-4102")).toContainText("Pendiente de confirmar");
    await expect(fila(page, "SVD-4102")).toContainText("Equipo de campo averiado · sugerido");
  });

  test("un JSON reimportado con triaje manda sobre localStorage, pero solo la primera vez", async ({ page }) => {
    await sembrarTriaje(page, {
      "SVD-4137": { estado: "Corregido", categoria: "Falsa alarma recurrente", urgencia: "Media", impacto: "Medio", fecha: "2020-01-01T00:00:00.000Z" },
    });
    const tickets = datasetReal();
    tickets.find((t) => t.id === "SVD-4137").triaje = {
      estado: "Confirmado", categoria: "Petición de acceso", urgencia: "Baja", impacto: "Bajo", fecha: "2026-09-20T00:00:00.000Z",
    };
    await servirDataset(page, tickets);
    await abrir(page);
    expect((await leerTriaje(page))["SVD-4137"].estado).toBe("Confirmado");

    await abrir(page, "#/ticket/SVD-4137");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await page.reload();
    expect(await leerTriaje(page)).not.toHaveProperty("SVD-4137");
  });

  test("las confirmaciones de ids que ya no existen se descartan", async ({ page }) => {
    await sembrarTriaje(page, {
      "SVD-9999": { estado: "Confirmado", categoria: "Petición de acceso", urgencia: "Baja", impacto: "Bajo", fecha: "2020-01-01T00:00:00.000Z" },
    });
    await abrir(page);
    expect(await leerTriaje(page)).not.toHaveProperty("SVD-9999");
  });
});
