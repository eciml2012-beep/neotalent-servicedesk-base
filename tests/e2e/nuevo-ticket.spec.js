// Nivel: sistema. Técnicas: casos de uso (la historia de R10) y transición de estados (creado →
// Pendiente de confirmar → confirmado, igual que cualquier otro ticket). Base: spec R10.
import { test, expect } from "@playwright/test";
import { abrir, exportar, fila, leerTriaje, aceptar } from "../soporte/app.js";

const DATOS = {
  titulo: "Alarma desactivada en el muelle",
  descripcion: "La alarma perimetral quedó desactivada tras el mantenimiento de esta mañana.",
  sistema: "Central de alarmas",
  reportadoPor: "Jefe de turno",
  zona: "Sala de servidores",
};

// El diálogo tiene sus propios "Sistema afectado" y "Zona": iguales de nombre a los filtros de
// la barra de la bandeja, así que las consultas se limitan al diálogo (evita el locator ambiguo).
async function crearTicket(page, datos = DATOS) {
  await abrir(page);
  await page.getByRole("button", { name: "Nuevo ticket" }).click();
  const dialogo = page.getByRole("dialog", { name: "Nuevo ticket" });
  await dialogo.getByLabel("Título").fill(datos.titulo);
  await dialogo.getByLabel("Descripción").fill(datos.descripcion);
  await dialogo.getByLabel("Sistema afectado").selectOption(datos.sistema);
  await dialogo.getByLabel("Reportado por").selectOption(datos.reportadoPor);
  await dialogo.getByLabel("Zona").selectOption(datos.zona);
  await dialogo.getByRole("button", { name: "Crear ticket" }).click();
}

test.describe("R10 · crear un ticket nuevo", { tag: ["@R10", "@humo"] }, () => {
  test("el botón «Nuevo ticket» está en la cabecera de la bandeja", async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole("button", { name: "Nuevo ticket" })).toBeVisible();
  });

  test("crear un ticket lo añade a la bandeja con id SVD-4160 y Pendiente de confirmar", async ({ page }) => {
    await crearTicket(page);
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await expect(fila(page, "SVD-4160")).toBeVisible();
    await expect(fila(page, "SVD-4160")).toContainText("Pendiente de confirmar");
    await expect(fila(page, "SVD-4160")).toContainText(DATOS.titulo);
  });

  test("dos tickets nuevos seguidos usan ids consecutivos sin repetirse", async ({ page }) => {
    await crearTicket(page, { ...DATOS, titulo: "Primero" });
    await crearTicket(page, { ...DATOS, titulo: "Segundo" });
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await expect(fila(page, "SVD-4160")).toContainText("Primero");
    await expect(fila(page, "SVD-4161")).toContainText("Segundo");
  });

  test("un ticket nuevo se puede aceptar y corregir como cualquier otro", async ({ page }) => {
    await crearTicket(page);
    await aceptar(page, "SVD-4160");
    expect((await leerTriaje(page))["SVD-4160"].estado).toBe("Confirmado");
  });

  test("sobrevive a recargar la página", async ({ page }) => {
    await crearTicket(page);
    await page.reload();
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await expect(fila(page, "SVD-4160")).toBeVisible();
  });

  test("se exporta junto con los 60, con su sugerencia y su triaje", async ({ page }) => {
    await crearTicket(page);
    const { datos } = await exportar(page);
    const nuevo = datos.find((t) => t.id === "SVD-4160");
    expect(datos).toHaveLength(61);
    expect(nuevo).toMatchObject({ titulo: DATOS.titulo, estado: "abierto", triaje: null });
    expect(nuevo.sugerencia).toHaveProperty("motivo");
    expect(nuevo.notas).toEqual([]);
  });

  test("título vacío no deja crear el ticket", async ({ page }) => {
    await abrir(page);
    await page.getByRole("button", { name: "Nuevo ticket" }).click();
    const dialogo = page.getByRole("dialog", { name: "Nuevo ticket" });
    await dialogo.getByLabel("Descripción").fill(DATOS.descripcion);
    await expect(dialogo.getByRole("button", { name: "Crear ticket" })).toBeDisabled();
  });

  test("un título o descripción con forma de DNI no se puede crear (principio 3)", { tag: "@P3" }, async ({ page }) => {
    await abrir(page);
    await page.getByRole("button", { name: "Nuevo ticket" }).click();
    const dialogo = page.getByRole("dialog", { name: "Nuevo ticket" });
    await dialogo.getByLabel("Título").fill("Aviso de 12345678Z en recepción");
    await dialogo.getByLabel("Descripción").fill(DATOS.descripcion);
    await expect(dialogo.getByRole("button", { name: "Crear ticket" })).toBeDisabled();
  });

  test("un ticket sin regla que encaje sale Sin clasificar, sin botón Aceptar", async ({ page }) => {
    await crearTicket(page, { ...DATOS, titulo: "Cosa rara", descripcion: "Pasó algo que no sé explicar bien del todo, sin más detalles." });
    await expect(fila(page, "SVD-4160")).toContainText("Sin clasificar");
    await page.getByLabel("Estado del triaje").selectOption("todos");
    await fila(page, "SVD-4160").click();
    await expect(page.getByRole("button", { name: "Aceptar" })).toHaveCount(0);
  });

  test("el texto se pinta como texto, nunca como HTML (XSS)", { tag: "@seguridad" }, async ({ page }) => {
    await crearTicket(page, { ...DATOS, titulo: '<img src=x onerror="window.__xss=1">' });
    await page.getByLabel("Estado del triaje").selectOption("todos");
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    await expect(fila(page, "SVD-4160").locator("img")).toHaveCount(0);
  });
});
