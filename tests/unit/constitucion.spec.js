// Nivel: análisis estático (pruebas sin ejecutar el código, ISTQB "static testing").
// Base: constitución P2 y P6; spec criterio 8 y caso límite "HTML en el texto del ticket".
import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const raiz = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const leer = (ruta) => readFileSync(join(raiz, ruta), "utf8");
const archivosJs = (dir) =>
  readdirSync(join(raiz, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivosJs(join(dir, e.name)) : e.name.endsWith(".js") ? [join(dir, e.name)] : []
  );
const codigoApp = ["index.html", "css/styles.css", ...archivosJs("js")].map((ruta) => [ruta, leer(ruta)]);
// Los comentarios explican a menudo lo que el código NO hace ("no toca localStorage"): se
// quitan para que las comprobaciones de uso miren solo código ejecutable.
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
const codigo = (ruta) => sinComentarios(leer(ruta));

test.describe("P6 · stack plano", { tag: ["@P6", "@CF8", "@estatico", "@humo"] }, () => {
  test("package.json solo tiene devDependencies (la app no necesita instalar nada)", () => {
    const pkg = JSON.parse(leer("package.json"));
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  for (const [ruta, codigo] of codigoApp) {
    test(`${ruta}: sin URLs externas, CDNs ni node_modules`, () => {
      expect(codigo).not.toMatch(/https?:\/\//);
      expect(codigo).not.toMatch(/@import/);
      expect(codigo).not.toMatch(/node_modules/);
    });
  }
});

test.describe("P2 · sin salidas al exterior", { tag: ["@P2", "@estatico"] }, () => {
  test("el único fetch de la app es data/tickets.json y está en app.js", () => {
    const conFetch = codigoApp.filter(([, c]) => /\bfetch\(/.test(c)).map(([r]) => r.replace(/\\/g, "/"));
    expect(conFetch).toEqual(["js/app.js"]);
    expect(leer("js/app.js").match(/fetch\(([^,)]+)/g)).toEqual(['fetch("data/tickets.json"']);
  });

  test("ni sendBeacon, ni WebSocket, ni XMLHttpRequest", () => {
    for (const [ruta, codigo] of codigoApp) {
      expect(codigo, ruta).not.toMatch(/sendBeacon|WebSocket|XMLHttpRequest|EventSource/);
    }
  });
});

test.describe("Seguridad · el texto del ticket nunca se interpreta como HTML", { tag: ["@CL-html", "@seguridad", "@estatico"] }, () => {
  // OWASP: el texto que viene de datos se inserta como texto, nunca como marcado.
  test("sin innerHTML, outerHTML, insertAdjacentHTML, document.write, eval ni new Function", () => {
    for (const [ruta, codigo] of codigoApp.filter(([r]) => r.endsWith(".js"))) {
      expect(codigo, ruta).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/);
    }
  });
});

test.describe("Arquitectura · responsabilidades de CLAUDE.md", { tag: ["@arquitectura", "@estatico"] }, () => {
  test("js/utils no toca el DOM ni localStorage", () => {
    for (const ruta of archivosJs("js/utils")) {
      expect(codigo(ruta), ruta).not.toMatch(/\bdocument\.|\bwindow\.|localStorage/);
    }
  });

  test("js/components no hace fetch ni lee localStorage", () => {
    for (const ruta of archivosJs("js/components")) {
      expect(codigo(ruta), ruta).not.toMatch(/\bfetch\(|localStorage/);
    }
  });

  test("solo app.js usa localStorage, y solo con las dos claves del spec (R6)", () => {
    const usan = codigoApp.filter(([ruta]) => /localStorage/.test(codigo(ruta))).map(([r]) => r.replace(/\\/g, "/"));
    expect(usan).toEqual(["js/app.js"]);
    const constantes = leer("js/utils/constantes.js");
    expect(constantes).toContain('CLAVE_TRIAJE = "svd-triaje"');
    expect(constantes).toContain('CLAVE_TEMA = "svd-tema"');
  });
});
