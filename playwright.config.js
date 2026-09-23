// Un solo runner para toda la pirámide:
// - unit: módulos puros de js/utils/ y el dataset, en Node, sin navegador.
// - e2e: flujos de la bandeja en Chromium, contra el mismo servidor con el que se usa la app.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    { name: "unit", testMatch: /unit\/.*\.spec\.js/ },
    {
      name: "e2e",
      testMatch: /e2e\/.*\.spec\.js/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:8000", trace: "retain-on-failure" },
    },
  ],
  // El mismo http.server de la biblioteca estándar con el que se usa la app, pero con una cola
  // de conexiones de 128 en vez de 5: con varios navegadores en paralelo, en Windows, la cola por
  // defecto rechazaba conexiones (ERR_CONNECTION_REFUSED). Es un problema del arnés, no de la app.
  webServer: {
    command:
      'python -c "import http.server as h; h.ThreadingHTTPServer.request_queue_size = 128; ' +
      "h.test(HandlerClass=h.SimpleHTTPRequestHandler, ServerClass=h.ThreadingHTTPServer, port=8000, bind='127.0.0.1')\"",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "ignore", // http.server escribe cada petición en stderr
  },
});
