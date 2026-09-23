// Nivel: sistema. Técnicas: transición de estados (nota ↔ Deshacer, Corregido ↔ motivo), casos
// límite del spec. Base: spec R9, decisiones 25-31, criterio 10; constitución P3 (enmienda).
import { test, expect } from "@playwright/test";
import { abrir, aceptar, anadirNota, corregir, exportar, fila, leerTriaje } from "../soporte/app.js";

const NOTA = "Revisado con mantenimiento: el lector falla solo con lluvia (nota inventada).";

test.describe("R9 · notas del operador", { tag: ["@R9", "@CF10"] }, () => {
  test("añadir una nota la enseña en la ficha con su fecha y vacía el campo", { tag: "@humo" }, async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await anadirNota(page, NOTA);
    const notas = page.getByRole("region", { name: "Notas del operador" });
    await expect(notas.locator(".notas__item")).toHaveCount(1);
    await expect(notas.locator(".notas__item")).toContainText(NOTA);
    await expect(page.getByLabel("Nueva nota")).toHaveValue("");
  });

  test("las notas se acumulan en orden y no hay forma de editarlas ni borrarlas (decisión 26)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await anadirNota(page, "primera nota inventada");
    await anadirNota(page, "segunda nota inventada");
    const items = page.locator(".notas__item .notas__texto");
    await expect(items).toHaveText(["primera nota inventada", "segunda nota inventada"]);
    const panel = page.getByRole("region", { name: "Notas del operador" });
    await expect(panel.getByRole("button")).toHaveText(["Añadir nota"]); // ni Editar ni Borrar
  });

  test("sobreviven a recargar la página", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await anadirNota(page, NOTA);
    await page.reload();
    await expect(page.locator(".notas__texto")).toHaveText([NOTA]);
  });

  test("sobreviven a Deshacer (decisión 27)", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    await abrir(page, "#/ticket/SVD-4102");
    await anadirNota(page, NOTA);
    await page.getByRole("button", { name: "Deshacer" }).click();
    await abrir(page, "#/ticket/SVD-4102");
    await expect(page.locator(".notas__texto")).toHaveText([NOTA]);
    expect(await leerTriaje(page)).not.toHaveProperty("SVD-4102");
  });

  test("se puede anotar un ticket pendiente, sin confirmarlo (sigue pendiente)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4100");
    await anadirNota(page, NOTA);
    await abrir(page);
    await expect(fila(page, "SVD-4100")).toContainText("Pendiente de confirmar");
  });

  test("añadir una nota cuenta como cambio sin exportar", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4100");
    await anadirNota(page, NOTA);
    await abrir(page);
    await expect(page.locator(".cabecera__aviso")).toHaveText(/cambios sin exportar/);
  });

  test("vacía o solo espacios: «Añadir nota» no se puede pulsar", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    const boton = page.getByRole("button", { name: "Añadir nota" });
    await expect(boton).toBeDisabled();
    await page.getByLabel("Nueva nota").fill("    ");
    await expect(boton).toBeDisabled();
  });

  test("el campo no admite más de 500 caracteres (valor límite)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await page.getByLabel("Nueva nota").fill("x".repeat(600));
    await expect(page.getByLabel("Nueva nota")).toHaveValue("x".repeat(500));
  });

  test("el aviso de datos personales está a la vista junto al campo (P3)", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await expect(page.getByLabel("Nueva nota")).toHaveAccessibleDescription(/No escribas nombres, DNI, matrículas/);
  });

  for (const [dato, tipo] of [["12345678Z", "DNI"], ["X1234567L", "NIE"], ["1234 BCD", "matrícula"]]) {
    test(`una nota con forma de ${tipo} no se puede guardar y se explica (P3)`, { tag: "@P3" }, async ({ page }) => {
      await abrir(page, "#/ticket/SVD-4104");
      await page.getByLabel("Nueva nota").fill(`Dato inventado ${dato} en la nota`);
      await expect(page.getByRole("button", { name: "Añadir nota" })).toBeDisabled();
      await expect(page.locator(".campo-texto__error")).toContainText(tipo);
    });
  }

  test("una nota con HTML se pinta como texto y no se ejecuta (XSS)", { tag: "@seguridad" }, async ({ page }) => {
    const dialogos = [];
    page.on("dialog", (d) => { dialogos.push(d.message()); d.dismiss(); });
    const html = '<img src=x onerror="alert(1)"><b>negrita</b>';
    await abrir(page, "#/ticket/SVD-4104");
    await anadirNota(page, html);
    await expect(page.locator(".notas__texto")).toHaveText([html]);
    await expect(page.locator(".notas__texto img, .notas__texto b")).toHaveCount(0);
    expect(dialogos).toEqual([]);
  });

  test("el export lleva las notas del ticket y `notas: []` en los demás", { tag: "@R6" }, async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104");
    await anadirNota(page, NOTA);
    await abrir(page);
    const { datos } = await exportar(page);
    const por = Object.fromEntries(datos.map((t) => [t.id, t.notas]));
    expect(por["SVD-4104"]).toEqual([{ texto: NOTA, fecha: expect.stringMatching(/^\d{4}-\d\d-\d\dT/) }]);
    expect(por["SVD-4100"]).toEqual([]);
  });
});

test.describe("R9 · motivo de la corrección", { tag: ["@R9", "@R5", "@CF10"] }, () => {
  test("si cambio la sugerencia, no puedo guardar sin motivo", async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Urgencia").selectOption("Alta");
    const guardar = page.getByRole("button", { name: "Guardar corrección" });
    await expect(guardar).toBeDisabled();
    await page.getByLabel("Motivo de la corrección").fill("123456789"); // 9: uno menos del mínimo
    await expect(guardar).toBeDisabled();
    await page.getByLabel("Motivo de la corrección").fill("1234567890");
    await expect(guardar).toBeEnabled();
  });

  test("si lo dejo igual que la IA, el motivo no hace falta y queda Confirmado con motivo null", async ({ page }) => {
    await corregir(page, "SVD-4104", {}, { motivo: "" });
    expect((await leerTriaje(page))["SVD-4104"]).toMatchObject({ estado: "Confirmado", motivoCorreccion: null });
  });

  test("un motivo escrito sobre algo que coincide con la IA no se guarda (solo es de un Corregido)", async ({ page }) => {
    await corregir(page, "SVD-4104", {}, { motivo: "Lo he revisado y la IA tiene razón." });
    expect((await leerTriaje(page))["SVD-4104"].motivoCorreccion).toBeNull();
  });

  test("un Corregido guarda el motivo recortado, lo enseña en la ficha y lo exporta", async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" }, { motivo: "  El lector ya no valida a nadie.  " });
    expect((await leerTriaje(page))["SVD-4104"]).toMatchObject({ estado: "Corregido", motivoCorreccion: "El lector ya no valida a nadie." });
    await abrir(page, "#/ticket/SVD-4104");
    await expect(page.locator(".caja-ia")).toContainText("Motivo de la corrección");
    await expect(page.locator(".caja-ia")).toContainText("El lector ya no valida a nadie.");
    await abrir(page);
    const { datos } = await exportar(page);
    expect(datos.find((t) => t.id === "SVD-4104").triaje.motivoCorreccion).toBe("El lector ya no valida a nadie.");
  });

  test("al reabrir un Corregido, el campo trae el motivo que ya tenía", async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" }, { motivo: "Motivo inventado de la primera vez." });
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await expect(page.getByLabel("Motivo de la corrección")).toHaveValue("Motivo inventado de la primera vez.");
  });

  test("Deshacer borra el motivo junto con la confirmación (decisión 27)", async ({ page }) => {
    await corregir(page, "SVD-4104", { Urgencia: "Alta" });
    await abrir(page, "#/ticket/SVD-4104");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await expect(page.getByLabel("Motivo de la corrección")).toHaveValue("");
  });

  test("un motivo con forma de DNI no deja guardar (P3)", { tag: "@P3" }, async ({ page }) => {
    await abrir(page, "#/ticket/SVD-4104/corregir");
    await page.getByLabel("Urgencia").selectOption("Alta");
    await page.getByLabel("Motivo de la corrección").fill("Lo confirmó el 12345678Z por teléfono");
    await expect(page.getByRole("button", { name: "Guardar corrección" })).toBeDisabled();
    await expect(page.locator(".campo-texto__error")).toContainText("DNI");
  });

  test("Aceptar guarda motivo null", async ({ page }) => {
    await aceptar(page, "SVD-4102");
    expect((await leerTriaje(page))["SVD-4102"].motivoCorreccion).toBeNull();
  });
});
