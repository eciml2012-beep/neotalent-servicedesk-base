// Tipo: prueba de caja blanca — cobertura de código (ISTQB). Recorre todos los flujos con la
// cobertura V8 de Chromium activada y mide qué fracción del JS de la app se ejecutó. Sin
// dependencias (principio 6): es aproximada por caracteres, no por sentencias como haría c8/istanbul.
// El umbral protege contra perder cobertura; no es un objetivo en sí mismo.
import { test, expect } from "@playwright/test";
import { datasetReal, exportar, servirDataset } from "../soporte/app.js";

const UMBRAL = 0.95; // medido: 98 % (23/09/2026). Justo por debajo, para detectar bajadas.

/** Caracteres ejecutados de una carga del script. */
function cubiertos({ source, functions }) {
  // Rangos de mayor a menor: los internos (más pequeños) sobrescriben a los que los contienen.
  const rangos = functions.flatMap((f) => f.ranges).sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
  const cubierto = new Array(source.length).fill(false);
  for (const { startOffset, endOffset, count } of rangos) cubierto.fill(count > 0, startOffset, endOffset);
  return cubierto;
}

/** Une varias cargas del mismo archivo: un carácter cuenta si se ejecutó en alguna. */
function unirPorArchivo(entradas) {
  const porUrl = new Map();
  for (const e of entradas) {
    const actual = porUrl.get(e.url);
    const nuevo = cubiertos(e);
    porUrl.set(e.url, { source: e.source, cubierto: actual ? actual.cubierto.map((v, i) => v || nuevo[i]) : nuevo });
  }
  return [...porUrl].map(([url, { source, cubierto }]) => {
    const utiles = [...source].map((c, i) => i).filter((i) => !/\s/.test(source[i]));
    return { archivo: url.replace(/^.*\/js\//, "js/"), total: utiles.length, hechos: utiles.filter((i) => cubierto[i]).length };
  });
}

test("cobertura del JS de la app en un recorrido completo", { tag: ["@cobertura"] }, async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium", "La cobertura V8 solo existe en Chromium");

  // Chromium descarta los contadores de un documento al navegar, aunque se pida no reiniciar.
  // Por eso: navegación por hash dentro de la misma página (como la usa una persona) y
  // recogida explícita antes de cada recarga.
  const recogidas = [];
  const recoger = async () => {
    recogidas.push(...(await page.coverage.stopJSCoverage()));
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
  };
  const ir = async (hash) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await expect(page.locator("main")).toBeVisible();
  };
  const boton = (nombre) => page.getByRole("button", { name: nombre }).click();

  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto("/");
  await expect(page.locator(".fila-ticket")).toHaveCount(60);

  // Bandeja y filtros
  for (const [campo, valor] of [["Prioridad", "Crítica"], ["Sistema afectado", "Central de alarmas"], ["Estado del triaje", "todos"], ["Estado del ticket", "abierto"], ["Zona", "Almacén Norte"]]) {
    await page.getByLabel(campo).selectOption(valor);
  }
  // Ficha: aceptar, corregir, corregir a Sin clasificar, Sin clasificar → real, cancelar, deshacer
  await ir("#/ticket/SVD-4102"); await boton("Aceptar");
  await ir("#/ticket/SVD-4104/corregir"); await page.getByLabel("Urgencia").selectOption("Alta");
  await page.getByLabel("Motivo de la corrección").fill("Motivo inventado para la cobertura, 12345678Z no vale");
  await page.getByLabel("Motivo de la corrección").fill("Motivo inventado para la cobertura.");
  await boton("Guardar corrección");
  await ir("#/ticket/SVD-4104"); // ficha de un Corregido (sugerencia original y motivo)
  await page.getByLabel("Nueva nota").fill("Nota inventada para la cobertura."); await boton("Añadir nota");
  await ir("#/ticket/SVD-4119/corregir"); await page.getByLabel("Categoría").selectOption("Sin clasificar");
  await page.getByLabel("Motivo de la corrección").fill("Motivo inventado para la cobertura.");
  await boton("Guardar corrección");
  await ir("#/ticket/SVD-4143"); await ir("#/ticket/SVD-4143/corregir");
  await page.getByLabel("Categoría").selectOption("Sin clasificar");
  await page.getByLabel("Categoría").selectOption("Falsa alarma recurrente");
  await boton("Cancelar");
  await ir("#/ticket/SVD-4102"); await boton("Deshacer");
  // R10: crear un ticket nuevo (con dato personal rechazado primero, para pasar por el error).
  await boton("Nuevo ticket");
  const dialogoNuevo = page.getByRole("dialog", { name: "Nuevo ticket" });
  await dialogoNuevo.getByLabel("Título").fill("Aviso de 12345678Z en recepción");
  await dialogoNuevo.getByLabel("Descripción").fill("Descripción inventada para la cobertura, sin sentido real.");
  await expect(dialogoNuevo.getByRole("button", { name: "Crear ticket" })).toBeDisabled();
  await dialogoNuevo.getByLabel("Título").fill("Alarma desactivada en el muelle de carga");
  await dialogoNuevo.getByLabel("Sistema afectado").selectOption("Central de alarmas");
  await dialogoNuevo.getByLabel("Reportado por").selectOption("Jefe de turno");
  await dialogoNuevo.getByLabel("Zona").selectOption("Muelle de carga");
  await dialogoNuevo.getByRole("button", { name: "Crear ticket" }).click();
  await boton("Nuevo ticket"); // segundo, sin regla que encaje: Sin clasificar
  const dialogoNuevo2 = page.getByRole("dialog", { name: "Nuevo ticket" });
  await dialogoNuevo2.getByLabel("Título").fill("Cosa rara sin más detalle");
  await dialogoNuevo2.getByLabel("Descripción").fill("Pasó algo que no sé explicar bien del todo, sin más.");
  await dialogoNuevo2.getByRole("button", { name: "Cancelar" }).click();
  await ir("#/ticket/SVD-9999");
  // Métricas, tema, exportar
  await ir("#/metricas");
  await page.getByRole("button", { name: /Tema/ }).click();
  await ir("#/bandeja");
  await exportar(page);
  await recoger();

  // Casos límite de datos y siembra desde un JSON reimportado (necesitan recargar)
  const roto = datasetReal();
  delete roto[0].sugerencia;
  roto[1].sugerencia = { ...roto[1].sugerencia, categoria: "Robo" };
  roto[2].sugerencia = { ...roto[2].sugerencia, motivo: "" };
  const s = roto[3].sugerencia;
  roto[3].triaje = { estado: "Confirmado", categoria: s.categoria, urgencia: s.urgencia, impacto: s.impacto };
  roto[3].notas = [{ texto: "Nota reimportada, inventada.", fecha: "2026-09-20T10:00:00.000Z" }];
  await servirDataset(page, roto);
  await page.evaluate(() => localStorage.setItem("svd-triaje", '{"SVD-9999":{"estado":"Confirmado"},"_notas":{"SVD-9999":[]}}'));
  await page.reload();
  await expect(page.locator(".fila-ticket").first()).toBeVisible();
  await ir(`#/ticket/${roto[1].id}`);
  await recoger();

  // Sin localStorage y con el JSON sin cargar
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("bloqueado"); }; });
  await page.reload();
  await expect(page.locator(".rail__aviso")).toBeVisible();
  await recoger();
  await page.route("**/data/tickets.json", (r) => r.fulfill({ status: 500, body: "" }));
  await page.reload();
  await expect(page.getByText("No se ha podido cargar")).toBeVisible();
  await recoger();

  const archivos = unirPorArchivo(recogidas.filter((e) => /\/js\/.*\.js$/.test(e.url)));
  const total = archivos.reduce((s, a) => s + a.hechos, 0) / archivos.reduce((s, a) => s + a.total, 0);
  const tabla = archivos
    .sort((a, b) => a.archivo.localeCompare(b.archivo))
    .map((a) => `${((a.hechos / a.total) * 100).toFixed(1).padStart(5)} %  ${a.archivo}`)
    .join("\n");
  const texto = `${tabla}\n-----\n${(total * 100).toFixed(1).padStart(5)} %  total`;
  await info.attach("cobertura.txt", { body: texto, contentType: "text/plain" });
  console.log(`\nCobertura JS (V8, aproximada)\n${texto}\n`);

  expect(archivos).toHaveLength(14);
  expect(total).toBeGreaterThanOrEqual(UMBRAL);
});
