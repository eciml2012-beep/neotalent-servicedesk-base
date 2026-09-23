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
  // http.server con cola de conexiones ampliada: ver tests/soporte/servidor.py.
  webServer: {
    command: "python tests/soporte/servidor.py",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "ignore", // http.server escribe cada petición en stderr
  },
});
