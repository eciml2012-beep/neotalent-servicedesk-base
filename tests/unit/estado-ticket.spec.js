// Nivel: unitario. Técnicas: transición de estados y casos límite del spec (error guessing
// dirigido). Base de prueba: spec R4, R5, R6 (sincronización), casos límite; constitución P1, P4.
import { test, expect } from "@playwright/test";
import { derivarTicket, estadoAlGuardar, snapshotDeSugerencia } from "../../js/utils/estado-ticket.js";

const MOTIVO = "Motivo de prueba con más de cuarenta caracteres, inventado.";
const ticket = (sugerencia, extra = {}) => ({
  id: "SVD-9001", titulo: "Ticket de prueba", descripcion: "Inventado", zona: "Almacén Norte", estado: "abierto",
  ...(sugerencia === undefined ? {} : { sugerencia }), ...extra,
});
const valida = { categoria: "Equipo de campo averiado", urgencia: "Media", impacto: "Medio", motivo: MOTIVO };
const confirmacion = (estado, valores, snapshot = snapshotDeSugerencia(valida)) => ({
  estado, ...valores, sugerenciaSnapshot: snapshot, fecha: "2026-09-23T10:00:00.000Z",
});

test.describe("P1 · sin confirmación, nada queda clasificado", { tag: ["@P1", "@R4"] }, () => {
  test("un ticket sin triaje guardado está Pendiente de confirmar y se pinta como sugerido", () => {
    const t = derivarTicket(ticket(valida), null);
    expect(t.estadoTriaje).toBe("Pendiente de confirmar");
    expect(t.esSugerido).toBe(true);
    expect(t.prioridad).toBe("Media");
  });

  test("con confirmación guardada manda lo confirmado y deja de ser sugerido", () => {
    const t = derivarTicket(ticket(valida), confirmacion("Corregido", { categoria: "Equipo de campo averiado", urgencia: "Alta", impacto: "Medio" }));
    expect(t.estadoTriaje).toBe("Corregido");
    expect(t.esSugerido).toBe(false);
    expect(t.urgencia).toBe("Alta");
    expect(t.prioridad).toBe("Alta"); // recalculada, nunca leída de lo guardado (P5)
  });
});

test.describe("Casos límite de la sugerencia", { tag: ["@CL", "@R8", "@P4", "@CF6"] }, () => {
  test("sin campo sugerencia → Sin clasificar, sin aviso («no como error»)", () => {
    const { sugerenciaEfectiva: s, prioridad } = derivarTicket(ticket(undefined), null);
    expect(s.categoria).toBe("Sin clasificar");
    expect(s.aviso).toBeNull();
    expect(prioridad).toBeNull();
  });

  test("categoría fuera de las 7 → Sin clasificar con aviso", () => {
    const s = derivarTicket(ticket({ ...valida, categoria: "Robo" }), null).sugerenciaEfectiva;
    expect(s.categoria).toBe("Sin clasificar");
    expect(s.aviso).toBe("Sugerencia descartada");
  });

  test("motivo vacío → Sin clasificar con aviso y la sugerencia no se muestra (P4)", () => {
    const s = derivarTicket(ticket({ ...valida, motivo: "" }), null).sugerenciaEfectiva;
    expect(s.categoria).toBe("Sin clasificar");
    expect(s.aviso).toBe("Sugerencia descartada");
    expect(s.motivo).not.toContain("Equipo de campo averiado");
  });

  test("combinación imposible (R8) → Sin clasificar con aviso que no enseña el motivo descartado", () => {
    const s = derivarTicket(ticket({ ...valida, categoria: "Brecha de seguridad activa", urgencia: "Baja" }), null).sugerenciaEfectiva;
    expect(s.categoria).toBe("Sin clasificar");
    expect(s.aviso).toBe("Sugerencia descartada");
    expect(s.motivo).not.toBe(MOTIVO);
  });

  test("«Sin clasificar» con urgencia/impacto no nulos → se ignoran, sin aviso", () => {
    const t = derivarTicket(ticket({ categoria: "Sin clasificar", urgencia: "Alta", impacto: "Alto", motivo: MOTIVO }), null);
    expect([t.urgencia, t.impacto, t.prioridad]).toEqual([null, null, null]);
    expect(t.sugerenciaEfectiva.aviso).toBeNull();
    expect(t.sugerenciaEfectiva.motivo).toBe(MOTIVO);
  });
});

test.describe("R6 · sincronización sugerencia ↔ confirmación", { tag: ["@R6"] }, () => {
  test("si Claude Code regenera la sugerencia, la confirmación anterior se invalida", () => {
    const otraSugerencia = { ...valida, urgencia: "Alta" };
    const t = derivarTicket(ticket(otraSugerencia), confirmacion("Confirmado", { categoria: valida.categoria, urgencia: "Media", impacto: "Medio" }));
    expect(t.estadoTriaje).toBe("Pendiente de confirmar");
    expect(t.triaje).toBeNull();
  });

  test("una confirmación sin snapshot (sembrada desde el JSON) se da por válida", () => {
    const t = derivarTicket(ticket(valida), { estado: "Confirmado", categoria: valida.categoria, urgencia: "Media", impacto: "Medio" });
    expect(t.estadoTriaje).toBe("Confirmado");
  });
});

test.describe("R5 · Confirmado o Corregido se mide contra la sugerencia", { tag: ["@R5", "@R7"] }, () => {
  test("guardar lo mismo que sugirió la IA → Confirmado", () => {
    expect(estadoAlGuardar(valida, { categoria: valida.categoria, urgencia: "Media", impacto: "Medio" })).toBe("Confirmado");
  });

  for (const campo of ["categoria", "urgencia", "impacto"]) {
    test(`cambiar solo ${campo} → Corregido`, () => {
      const cambios = { categoria: "Pérdida de registro o evidencia", urgencia: "Alta", impacto: "Bajo" };
      const valores = { categoria: valida.categoria, urgencia: valida.urgencia, impacto: valida.impacto, [campo]: cambios[campo] };
      expect(estadoAlGuardar(valida, valores)).toBe("Corregido");
    });
  }

  test("clasificar un Sin clasificar → Corregido", () => {
    const sinClasificar = { categoria: "Sin clasificar", urgencia: null, impacto: null };
    expect(estadoAlGuardar(sinClasificar, { categoria: "Equipo de campo averiado", urgencia: "Alta", impacto: "Medio" })).toBe("Corregido");
  });

  test("corregir a Sin clasificar una sugerencia real → Corregido (punto 13 de la 2ª revisión)", () => {
    expect(estadoAlGuardar(valida, { categoria: "Sin clasificar", urgencia: null, impacto: null })).toBe("Corregido");
  });
});
