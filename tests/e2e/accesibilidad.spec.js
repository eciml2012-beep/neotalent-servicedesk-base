// Nivel: sistema (e2e). Característica ISO/IEC 25010: usabilidad → accesibilidad.
// Base de prueba: WCAG 2.2 nivel AA (criterios citados en cada test) y las reglas de docs/diseno.md.
// Sin axe-core (sería otra dependencia, principio 6): se comprueban a mano los criterios que se
// pueden medir; el resto queda para la revisión manual (docs/pruebas/uat.md).
import { test, expect } from "@playwright/test";
import { abrir } from "../soporte/app.js";

const PANTALLAS = ["#/bandeja", "#/ticket/SVD-4102", "#/ticket/SVD-4143", "#/ticket/SVD-4104/corregir", "#/metricas"];

/** Contraste WCAG de cada texto visible contra su fondo efectivo. Devuelve los que no llegan. */
async function textosSinContraste(page) {
  return page.evaluate(() => {
    // "rgb(r, g, b)" no trae alfa: es opaco. Tratarlo como transparente midió contra blanco.
    const rgba = (c) => {
      const v = (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
      return v.length === 3 ? [...v, 1] : v;
    };
    const mezcla = ([r, g, b, a = 1], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const fondo = (el) => {
      const capas = [];
      for (let e = el; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) { capas.push(c); if (c[3] >= 1) break; }
      }
      return capas.reverse().reduce((base, capa) => mezcla(capa, base), [255, 255, 255]);
    };
    const fallos = [];
    for (const el of document.querySelectorAll("body *")) {
      const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
      if (!texto || !el.getClientRects().length) continue;
      if (el.closest(":disabled, [disabled]")) continue; // WCAG 1.4.3 exime los controles deshabilitados
      const cs = getComputedStyle(el);
      const bg = fondo(el);
      const fg = mezcla(rgba(cs.color), bg);
      const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const ratio = (L1 + 0.05) / (L2 + 0.05);
      const px = parseFloat(cs.fontSize);
      const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
      if (ratio < (grande ? 3 : 4.5)) fallos.push(`${ratio.toFixed(2)} «${texto.slice(0, 40)}» (${el.className || el.tagName})`);
    }
    return fallos;
  });
}

for (const tema of ["claro", "oscuro"]) {
  test.describe(`WCAG 1.4.3 · contraste mínimo, tema ${tema}`, { tag: ["@accesibilidad", "@wcag"] }, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("svd-tema", t), tema);
    });
    for (const hash of PANTALLAS) {
      test(`${hash}: todo el texto llega a 4,5:1 (3:1 si es grande)`, async ({ page }) => {
        await abrir(page, hash);
        expect(await textosSinContraste(page)).toEqual([]);
      });
    }
  });
}

test.describe("WCAG · estructura, nombres y teclado", { tag: ["@accesibilidad", "@wcag"] }, () => {
  test("3.1.1 idioma de la página y 2.4.2 título", async ({ page }) => {
    await abrir(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page).toHaveTitle("Mini Service Desk");
  });

  test("4.1.2 todos los botones, enlaces y desplegables tienen nombre accesible", async ({ page }) => {
    for (const hash of PANTALLAS) {
      await abrir(page, hash);
      const sinNombre = await page.evaluate(() =>
        [...document.querySelectorAll("button, a, select")]
          .filter((e) => !(e.getAttribute("aria-label") || (e.labels && e.labels.length) || e.textContent.trim()))
          .map((e) => e.outerHTML.slice(0, 60))
      );
      expect(sinNombre, hash).toEqual([]);
    }
  });

  test("2.1.1 se puede triar solo con teclado: llegar a una fila, abrirla y aceptar", async ({ page }) => {
    await abrir(page);
    for (let i = 0; i < 30 && !(await page.evaluate(() => document.activeElement?.classList.contains("fila-ticket"))); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(page.locator(".fila-ticket:focus")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/ticket\//);

    await page.goto("/#/ticket/SVD-4102");
    for (let i = 0; i < 30 && (await page.evaluate(() => document.activeElement?.textContent)) !== "Aceptar"; i++) {
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL(/#\/ticket\/SVD-4102$/); // pasa al siguiente pendiente
  });

  test("2.4.7 el foco se ve", async ({ page }) => {
    await abrir(page);
    await page.keyboard.press("Tab");
    const contorno = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(contorno).not.toBe("none");
  });

  test("1.4.10 reflujo: a 320 px de ancho no hay scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const hash of PANTALLAS) {
      await abrir(page, hash);
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(ancho, hash).toBeLessThanOrEqual(320);
    }
  });
});

test.describe("docs/diseno.md · reglas visuales medibles", { tag: ["@diseno"] }, () => {
  test("botones, desplegables y enlaces del rail miden al menos 44 px de alto", async ({ page }) => {
    for (const hash of PANTALLAS) {
      await abrir(page, hash);
      const bajos = await page.evaluate(() =>
        [...document.querySelectorAll(".boton, select, .rail__enlace, .rail__tema")]
          .filter((e) => e.getBoundingClientRect().height < 44)
          .map((e) => `${e.className} ${e.getBoundingClientRect().height}px`)
      );
      expect(bajos, hash).toEqual([]);
    }
  });

  test("ningún texto por debajo de 12 px", async ({ page }) => {
    for (const hash of PANTALLAS) {
      await abrir(page, hash);
      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
          .map((e) => e.className || e.tagName)
      );
      expect(pequenos, hash).toEqual([]);
    }
  });

  test("el rojo terroso solo aparece en «Brecha de seguridad activa»", async ({ page }) => {
    for (const hash of PANTALLAS) {
      await abrir(page, hash);
      const fuera = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => [getComputedStyle(e).color, getComputedStyle(e).borderTopColor].includes("rgb(138, 47, 30)"))
          .filter((e) => !e.closest(".badge--brecha"))
          .map((e) => e.className || e.tagName)
      );
      expect(fuera, hash).toEqual([]);
    }
  });
});
