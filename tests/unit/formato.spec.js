// Nivel: unitario. Técnica: valores límite (cambio de día y de año).
import { test, expect } from "@playwright/test";
import { formatearFecha, formatearFechaHora, fechaLocal } from "../../js/utils/formato.js";

test.describe("Formato de fechas", { tag: ["@R4", "@R6"] }, () => {
  test("fecha del ticket AAAA-MM-DD → DD/MM/AAAA sin pasar por zona horaria", () => {
    expect(formatearFecha("2026-09-01")).toBe("01/09/2026");
    expect(formatearFecha("2026-12-31")).toBe("31/12/2026");
  });

  test("fecha del nombre del export: la local, justo después de medianoche (valor límite)", () => {
    expect(fechaLocal(new Date(2026, 8, 24, 0, 30))).toBe("2026-09-24");
    expect(fechaLocal(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(fechaLocal(new Date(2027, 0, 1, 0, 0))).toBe("2027-01-01");
  });

  test("fecha y hora del último export en hora local, con ceros a la izquierda", () => {
    const local = new Date(2026, 0, 5, 7, 3); // 05/01/2026 07:03 en la zona del equipo
    expect(formatearFechaHora(local.toISOString())).toMatch(/^05\/01\/2026,? 07:03$/);
  });
});
