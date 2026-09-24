// Arnés de pruebas e2e: preparar estado y leer resultados sin tocar data/tickets.json.
import { readFileSync } from "node:fs";
import { expect } from "@playwright/test";

const RUTA_DATASET = new URL("../../data/tickets.json", import.meta.url);

/** Copia fresca del dataset real, para modificarla en un test sin tocar el archivo. */
export const datasetReal = () => JSON.parse(readFileSync(RUTA_DATASET, "utf8"));

/** Sirve `tickets` en lugar de data/tickets.json solo para esta página. */
export async function servirDataset(page, tickets) {
  await page.route("**/data/tickets.json", (ruta) => ruta.fulfill({ json: tickets }));
}

/**
 * Deja `valor` en svd-triaje antes de que arranque la app (estado previo de un test).
 * Solo la primera carga de la pestaña: si se sembrara en cada recarga, pisaría lo que la app
 * guarda y los tests de persistencia pasarían o fallarían por el arnés, no por la app.
 */
export async function sembrarTriaje(page, valor) {
  await page.addInitScript((v) => {
    if (sessionStorage.getItem("__sembrado")) return;
    localStorage.setItem("svd-triaje", v);
    sessionStorage.setItem("__sembrado", "1");
  }, JSON.stringify(valor));
}

/** Abre una ruta de la app y espera a que la bandeja o la ficha estén pintadas. */
export async function abrir(page, hash = "#/bandeja") {
  await page.goto(`/${hash}`);
  await expect(page.locator("main")).toBeVisible();
}

/** Escribe una nota en la ficha abierta y la añade (R9). */
export async function anadirNota(page, texto) {
  await page.getByLabel("Nueva nota").fill(texto);
  await page.getByRole("button", { name: "Añadir nota" }).click();
}

export const fila = (page, id) => page.locator(`.fila-ticket[data-id="${id}"]`);

/** Lee svd-triaje tal como lo dejó la app. */
export const leerTriaje = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("svd-triaje") ?? "{}"));

/** Pulsa Exportar y devuelve { nombre, datos } del JSON descargado. */
export async function exportar(page) {
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Exportar/ }).click()]);
  const datos = JSON.parse(readFileSync(await descarga.path(), "utf8"));
  return { nombre: descarga.suggestedFilename(), datos };
}

/** Tras decidir un ticket, la app pasa al siguiente pendiente, o a la bandeja si no quedan (diseno.md, 24/09/2026). */
const salirDe = (page, id) => expect(page).not.toHaveURL(new RegExp(`#/ticket/${id}(/corregir)?$`));

/** Acepta la sugerencia de un ticket desde su ficha. */
export async function aceptar(page, id) {
  await abrir(page, `#/ticket/${id}`);
  await page.getByRole("button", { name: "Aceptar" }).click();
  await salirDe(page, id);
}

export const MOTIVO_CORRECCION = "El texto del ticket no encaja con lo sugerido (motivo inventado para la prueba).";

/**
 * Abre Corregir, aplica `cambios` ({ Categoría, Urgencia, Impacto }), escribe el motivo de la
 * corrección (R9: obligatorio si queda Corregido; `motivo: ""` lo deja vacío) y guarda.
 */
export async function corregir(page, id, cambios = {}, { motivo = MOTIVO_CORRECCION } = {}) {
  await abrir(page, `#/ticket/${id}/corregir`);
  for (const campo of ["Categoría", "Urgencia", "Impacto"]) {
    if (cambios[campo]) await page.getByLabel(campo).selectOption(cambios[campo]);
  }
  await page.getByLabel("Motivo de la corrección").fill(motivo);
  await page.getByRole("button", { name: "Guardar corrección" }).click();
  await salirDe(page, id);
}
