// Nivel: unitario. Técnicas: particiones de equivalencia (estados del triaje) y casos
// construidos a mano con resultado calculado desde el spec. Base: spec R4 (orden, filtros), R7.
import { test, expect } from "@playwright/test";
import { derivarTicket } from "../../js/utils/estado-ticket.js";
import { ordenarBandeja, filtrarTickets, calcularMetricas } from "../../js/utils/filtros.js";

const MOTIVO = "Motivo de prueba con más de cuarenta caracteres, inventado.";
const sug = (categoria, urgencia, impacto) => ({ categoria, urgencia, impacto, motivo: MOTIVO });
const t = (id, sugerencia, zona = "Almacén Norte", estado = "abierto", triaje = null) =>
  derivarTicket({ id, titulo: id, descripcion: "", zona, estado, sistema_afectado: "App de rondas", sugerencia }, triaje);
const guardado = (estado, categoria, urgencia, impacto, s) => ({
  estado, categoria, urgencia, impacto, sugerenciaSnapshot: { categoria: s.categoria, urgencia: s.urgencia, impacto: s.impacto },
});

const sBaja = sug("Petición de acceso", "Baja", "Bajo"); // Baja
const sCritica = sug("Brecha de seguridad activa", "Alta", "Alto"); // Crítica
const sMedia = sug("Equipo de campo averiado", "Media", "Medio"); // Media
const sSinClas = { categoria: "Sin clasificar", urgencia: null, impacto: null, motivo: MOTIVO };

test.describe("R4 · orden de la bandeja", { tag: ["@R4"] }, () => {
  test("Sin clasificar primero, luego por prioridad Crítica → Baja, y los revisados al final", () => {
    const tickets = [
      t("SVD-9001", sBaja),
      t("SVD-9002", sMedia, "Almacén Norte", "abierto", guardado("Confirmado", "Equipo de campo averiado", "Media", "Medio", sMedia)),
      t("SVD-9003", sCritica, "Perímetro exterior"),
      t("SVD-9004", sSinClas),
      t("SVD-9005", sMedia),
    ];
    expect(ordenarBandeja(tickets).map((x) => x.id)).toEqual(["SVD-9004", "SVD-9003", "SVD-9005", "SVD-9001", "SVD-9002"]);
  });

  test("ordenar no muta la lista original", () => {
    const tickets = [t("SVD-9001", sBaja), t("SVD-9003", sCritica, "Perímetro exterior")];
    const copia = tickets.map((x) => x.id);
    ordenarBandeja(tickets);
    expect(tickets.map((x) => x.id)).toEqual(copia);
  });
});

test.describe("R4 · filtros", { tag: ["@R4"] }, () => {
  const tickets = [
    t("SVD-9001", sBaja, "Almacén Norte", "cerrado"),
    t("SVD-9002", sMedia, "Almacén Norte", "abierto", guardado("Confirmado", "Equipo de campo averiado", "Media", "Medio", sMedia)),
    t("SVD-9003", sCritica, "Perímetro exterior", "abierto", guardado("Corregido", "Brecha de seguridad activa", "Alta", "Medio", sCritica)),
    t("SVD-9004", sSinClas),
  ];
  const ids = (filtros) => filtrarTickets(tickets, filtros).map((x) => x.id);

  test("por defecto: solo pendientes, cerrados incluidos (decisión 9)", () => {
    expect(ids({})).toEqual(["SVD-9001", "SVD-9004"]);
  });
  test("estado del triaje: Confirmados", () => expect(ids({ estadoTriaje: "Confirmado" })).toEqual(["SVD-9002"]));
  test("estado del triaje: Corregidos", () => expect(ids({ estadoTriaje: "Corregido" })).toEqual(["SVD-9003"]));
  test("estado del triaje: Todos", () => expect(ids({ estadoTriaje: "todos" })).toHaveLength(4));
  test("prioridad: la calculada, no la sugerida", () => {
    expect(ids({ estadoTriaje: "todos", prioridad: "Alta" })).toEqual(["SVD-9003"]); // corregido de Crítica a Alta
  });
  test("zona", () => expect(ids({ estadoTriaje: "todos", zona: "Perímetro exterior" })).toEqual(["SVD-9003"]));
  test("estado del ticket", () => expect(ids({ estadoTriaje: "todos", estado: "cerrado" })).toEqual(["SVD-9001"]));
  test("los filtros se combinan (Y lógico)", () => {
    expect(ids({ estadoTriaje: "todos", zona: "Almacén Norte", estado: "abierto" })).toEqual(["SVD-9002", "SVD-9004"]);
  });
});

test.describe("R7 · métricas", { tag: ["@R7"] }, () => {
  // IA dice Equipo averiado en dos; uno se confirma, el otro se corrige a Brecha.
  const tickets = [
    t("SVD-9001", sMedia, "Almacén Norte", "abierto", guardado("Confirmado", "Equipo de campo averiado", "Media", "Medio", sMedia)),
    t("SVD-9002", sMedia, "Almacén Norte", "abierto", guardado("Corregido", "Brecha de seguridad activa", "Alta", "Medio", sMedia)),
    t("SVD-9003", sBaja),
    t("SVD-9004", sSinClas),
  ];
  const m = calcularMetricas(tickets);

  test("pendientes, confirmados y corregidos", () => {
    expect([m.pendientes, m.confirmados, m.corregidos]).toEqual([2, 1, 1]);
  });
  test("tasa de corrección = Corregido / (Confirmado + Corregido)", () => {
    expect(m.tasaCorreccion).toBe(0.5);
  });
  test("la tasa por categoría se agrupa por la categoría SUGERIDA por la IA", () => {
    expect(m.tasaPorCategoria["Equipo de campo averiado"]).toBe(0.5);
    expect(m.tasaPorCategoria["Brecha de seguridad activa"]).toBeUndefined();
  });
  test("sin revisados, la tasa no existe (no es 0 %)", () => {
    expect(calcularMetricas([t("SVD-9003", sBaja)]).tasaCorreccion).toBeNull();
  });
  test("por prioridad cuenta la prioridad calculada; los Sin clasificar no cuentan", () => {
    expect(m.porPrioridad).toEqual({ Crítica: 0, Alta: 1, Media: 1, Baja: 1 });
  });
});
