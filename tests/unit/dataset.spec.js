// Nivel: unitario sobre datos. Base: constitución P3 y P4; spec R1, R2, R8; criterios 1 y 3.
// Es la versión repetible de los comandos Python de CLAUDE.md.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { esSugerenciaCoherente } from "../../js/utils/prioridad.js";
import { CATEGORIAS, SIN_CLASIFICAR, URGENCIAS, IMPACTOS } from "../../js/utils/constantes.js";

const tickets = JSON.parse(readFileSync(new URL("../../data/tickets.json", import.meta.url), "utf8"));

// Dominios cerrados, copiados de CLAUDE.md (sección Dataset), no de los datos.
const SISTEMAS = ["Control de accesos", "SailPoint (identidades)", "CCTV / videovigilancia", "Central de alarmas", "Centralita de guardia", "App de rondas"];
const REPORTADO_POR = ["Guardia de seguridad", "Jefe de turno", "Coordinador de zona", "Recepción cliente", "Administración", "Técnico de mantenimiento"];

test.describe("P3 · dataset cerrado y sintético", { tag: ["@P3", "@datos", "@humo"] }, () => {
  test("60 tickets, SVD-4100 a SVD-4159, consecutivos y sin repetir", () => {
    const esperados = Array.from({ length: 60 }, (_, i) => `SVD-${4100 + i}`);
    expect(tickets.map((t) => t.id)).toEqual(esperados);
  });

  test("50 abiertos y 10 cerrados", () => {
    expect(tickets.filter((t) => t.estado === "abierto")).toHaveLength(50);
    expect(tickets.filter((t) => t.estado === "cerrado")).toHaveLength(10);
  });

  test("fechas del 2026-09-01 al 2026-09-14 con formato AAAA-MM-DD", () => {
    for (const t of tickets) {
      expect(t.fecha, t.id).toMatch(/^2026-09-(0[1-9]|1[0-4])$/);
    }
  });

  test("sistema y quién reporta salen de listas cerradas: no hay nombres de personas", () => {
    for (const t of tickets) {
      expect(SISTEMAS, t.id).toContain(t.sistema_afectado);
      expect(REPORTADO_POR, t.id).toContain(t.reportado_por);
    }
  });

  test("12 zonas distintas", () => {
    expect(new Set(tickets.map((t) => t.zona)).size).toBe(12);
  });
});

test.describe("R1 · forma de la sugerencia", { tag: ["@R1", "@P4", "@CF1", "@datos", "@humo"] }, () => {
  test("todos los tickets tienen sugerencia con exactamente las cuatro claves", () => {
    for (const t of tickets) {
      expect(Object.keys(t.sugerencia ?? {}).sort(), t.id).toEqual(["categoria", "impacto", "motivo", "urgencia"]);
    }
  });

  test("categoría, urgencia e impacto dentro de sus enums", () => {
    for (const { id, sugerencia: s } of tickets) {
      expect([...CATEGORIAS, SIN_CLASIFICAR], id).toContain(s.categoria);
      if (s.categoria === SIN_CLASIFICAR) continue;
      expect(URGENCIAS, id).toContain(s.urgencia);
      expect(IMPACTOS, id).toContain(s.impacto);
    }
  });

  test("con «Sin clasificar», urgencia e impacto son null y el motivo sigue", () => {
    for (const { id, sugerencia: s } of tickets.filter((t) => t.sugerencia.categoria === SIN_CLASIFICAR)) {
      expect(s.urgencia, id).toBeNull();
      expect(s.impacto, id).toBeNull();
      expect(s.motivo.trim().length, id).toBeGreaterThan(0);
    }
  });

  test("ningún motivo tiene menos de 40 caracteres (criterio 1)", () => {
    const cortos = tickets.filter((t) => t.sugerencia.motivo.trim().length < 40).map((t) => t.id);
    expect(cortos).toEqual([]);
  });

  test("el motivo cita un hecho del ticket: al menos su zona (aproximación automática del principio 4)", () => {
    // El spec declara que citar hechos no es comprobable del todo; esto comprueba la parte que sí.
    const sinZona = tickets.filter((t) => !t.sugerencia.motivo.includes(t.zona)).map((t) => t.id);
    expect(sinZona).toEqual([]);
  });

  test("ningún ticket guarda la prioridad (principio 5)", () => {
    for (const t of tickets) {
      expect(t, t.id).not.toHaveProperty("prioridad");
      expect(t.sugerencia, t.id).not.toHaveProperty("prioridad");
    }
  });
});

test.describe("R2 + R8 · coherencia de las 60 sugerencias", { tag: ["@R2", "@R8", "@CF3", "@datos"] }, () => {
  test("ninguna sugerencia con categoría real incumple R8 (criterio 3)", () => {
    const incoherentes = tickets
      .filter((t) => t.sugerencia.categoria !== SIN_CLASIFICAR)
      .filter((t) => !esSugerenciaCoherente(t.sugerencia, t.zona))
      .map((t) => t.id);
    expect(incoherentes).toEqual([]);
  });

  test("reparto por categoría igual al documentado en docs/categorias-triaje.md", () => {
    const reparto = {};
    for (const t of tickets) reparto[t.sugerencia.categoria] = (reparto[t.sugerencia.categoria] ?? 0) + 1;
    expect(reparto).toEqual({
      "Brecha de seguridad activa": 12,
      "Pérdida de registro o evidencia": 12,
      "Equipo de campo averiado": 8,
      "Fallo de integración entre sistemas": 8,
      "Petición de acceso": 8,
      "Falsa alarma recurrente": 4,
      "Petición de información": 4,
      "Sin clasificar": 4,
    });
  });

  test("un triaje, si el JSON lo trae (export reimportado), solo puede ser Confirmado o Corregido", () => {
    for (const t of tickets.filter((x) => x.triaje)) {
      expect(["Confirmado", "Corregido"], t.id).toContain(t.triaje.estado);
    }
  });
});
