// Nivel: integración de componentes (ISTQB). Los módulos de js/utils juntos, sobre el dataset
// real, sin navegador: derivar estado → filtrar → ordenar → métricas. Los unitarios prueban cada
// pieza con datos inventados; esto prueba que encajan con los datos de verdad.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { derivarTicket } from "../../js/utils/estado-ticket.js";
import { filtrarTickets, ordenarBandeja, calcularMetricas } from "../../js/utils/filtros.js";

const tickets = JSON.parse(readFileSync(new URL("../../data/tickets.json", import.meta.url), "utf8"));
const confirmacion = (t, estado, cambios = {}) => ({
  estado, categoria: t.sugerencia.categoria, urgencia: t.sugerencia.urgencia, impacto: t.sugerencia.impacto, ...cambios,
  sugerenciaSnapshot: { categoria: t.sugerencia.categoria, urgencia: t.sugerencia.urgencia, impacto: t.sugerencia.impacto },
});

test.describe("Integración · js/utils sobre el dataset real", { tag: ["@integracion", "@R4", "@R7"] }, () => {
  test("sin nada confirmado: 60 pendientes, Sin clasificar arriba y métricas coherentes con la bandeja", () => {
    const derivados = tickets.map((t) => derivarTicket(t, null));
    const bandeja = ordenarBandeja(filtrarTickets(derivados, {}));
    const m = calcularMetricas(derivados);

    expect(bandeja).toHaveLength(60);
    expect(bandeja.slice(0, 4).every((t) => t.categoria === "Sin clasificar")).toBe(true);
    expect(m.pendientes).toBe(bandeja.length);
    expect(Object.values(m.porPrioridad).reduce((a, b) => a + b, 0)).toBe(60 - 4); // los Sin clasificar no tienen prioridad
    expect(Object.values(m.porCategoria).reduce((a, b) => a + b, 0)).toBe(60);
  });

  test("tras confirmar y corregir, bandeja, filtros y métricas cuentan lo mismo", () => {
    const [a, b] = [tickets.find((t) => t.id === "SVD-4119"), tickets.find((t) => t.id === "SVD-4104")];
    const guardado = { "SVD-4119": confirmacion(a, "Confirmado"), "SVD-4104": confirmacion(b, "Corregido", { urgencia: "Alta" }) };
    const derivados = tickets.map((t) => derivarTicket(t, guardado[t.id] ?? null));
    const m = calcularMetricas(derivados);

    expect(filtrarTickets(derivados, {})).toHaveLength(m.pendientes);
    expect(filtrarTickets(derivados, { estadoTriaje: "Confirmado" })).toHaveLength(m.confirmados);
    expect(filtrarTickets(derivados, { estadoTriaje: "Corregido" })).toHaveLength(m.corregidos);
    expect(m.pendientes + m.confirmados + m.corregidos).toBe(60);
    expect(ordenarBandeja(filtrarTickets(derivados, { estadoTriaje: "todos" })).slice(-2).map((t) => t.id).sort()).toEqual(["SVD-4104", "SVD-4119"]);
    expect(derivados.find((t) => t.id === "SVD-4104").prioridad).toBe("Crítica"); // Alta × Alto por la matriz
  });

  test("el filtro por prioridad coincide con el recuento de métricas para cada nivel", () => {
    const derivados = tickets.map((t) => derivarTicket(t, null));
    const m = calcularMetricas(derivados);
    for (const nivel of ["Crítica", "Alta", "Media", "Baja"]) {
      expect(filtrarTickets(derivados, { estadoTriaje: "todos", prioridad: nivel }), nivel).toHaveLength(m.porPrioridad[nivel]);
    }
  });
});
