// Nivel: unitario. Técnica: tabla de decisión (ISO/IEC/IEEE 29119-4, 5.2.6).
// Base de prueba: spec R3 (matriz) y R8 (coherencia categoría × urgencia, impacto × zona).
import { test, expect } from "@playwright/test";
import { calcularPrioridad, esSugerenciaCoherente, urgenciasPermitidas } from "../../js/utils/prioridad.js";

const MOTIVO = "Motivo de prueba con más de cuarenta caracteres, inventado.";

test.describe("R3 · matriz de prioridad", { tag: ["@R3", "@P5", "@CF2"] }, () => {
  // Las 9 celdas de la tabla del spec, copiadas del spec y no de la implementación.
  const tabla = [
    ["Alta", "Alto", "Crítica"], ["Alta", "Medio", "Alta"], ["Alta", "Bajo", "Media"],
    ["Media", "Alto", "Alta"], ["Media", "Medio", "Media"], ["Media", "Bajo", "Baja"],
    ["Baja", "Alto", "Media"], ["Baja", "Medio", "Baja"], ["Baja", "Bajo", "Baja"],
  ];
  for (const [urgencia, impacto, prioridad] of tabla) {
    test(`${urgencia} × ${impacto} → ${prioridad}`, () => {
      expect(calcularPrioridad(urgencia, impacto)).toBe(prioridad);
    });
  }

  test("sin urgencia o sin impacto no hay prioridad (Sin clasificar)", () => {
    expect(calcularPrioridad(null, "Alto")).toBeNull();
    expect(calcularPrioridad("Alta", null)).toBeNull();
    expect(calcularPrioridad(undefined, undefined)).toBeNull();
  });

  test("un valor fuera del enum no produce prioridad", () => {
    expect(calcularPrioridad("Urgentísima", "Alto")).toBeNull();
  });
});

test.describe("R8 · urgencia obligatoria por categoría", { tag: ["@R8"] }, () => {
  const tabla = [
    ["Brecha de seguridad activa", ["Alta"]],
    ["Petición de acceso", ["Baja"]],
    ["Petición de información", ["Baja"]],
    ["Falsa alarma recurrente", ["Media", "Baja"]],
    ["Equipo de campo averiado", null],
    ["Pérdida de registro o evidencia", null],
    ["Fallo de integración entre sistemas", null],
  ];
  for (const [categoria, permitidas] of tabla) {
    test(`${categoria}: ${permitidas ? permitidas.join(" o ") : "libre"}`, () => {
      expect(urgenciasPermitidas(categoria)).toEqual(permitidas);
    });
  }
});

test.describe("R8 · coherencia de la sugerencia", { tag: ["@R8", "@CF3"] }, () => {
  const sug = (categoria, urgencia, impacto) => ({ categoria, urgencia, impacto, motivo: MOTIVO });

  // Cada fila: categoría, urgencia, impacto, zona, ¿coherente?
  const tabla = [
    ["Brecha de seguridad activa", "Alta", "Alto", "Perímetro exterior", true],
    ["Brecha de seguridad activa", "Alta", "Medio", "Almacén Norte", true],
    ["Brecha de seguridad activa", "Media", "Medio", "Almacén Norte", false], // brecha ≠ Alta
    ["Brecha de seguridad activa", "Alta", "Bajo", "Almacén Norte", false], // brecha nunca Bajo (R2)
    ["Petición de acceso", "Baja", "Bajo", "Sala de servidores", true],
    ["Petición de acceso", "Media", "Bajo", "Almacén Norte", false],
    ["Petición de información", "Baja", "Alto", "Torre de control", true],
    ["Petición de información", "Alta", "Medio", "Almacén Norte", false],
    ["Falsa alarma recurrente", "Media", "Medio", "Muelle de carga", true],
    ["Falsa alarma recurrente", "Baja", "Medio", "Muelle de carga", true],
    ["Falsa alarma recurrente", "Alta", "Medio", "Muelle de carga", false],
    ["Equipo de campo averiado", "Alta", "Medio", "Almacén Norte", true],
    ["Equipo de campo averiado", "Baja", "Bajo", "Almacén Norte", true],
    ["Pérdida de registro o evidencia", "Media", "Alto", "Sala de servidores", true],
    ["Fallo de integración entre sistemas", "Media", "Medio", "Oficinas centrales", true],
  ];
  for (const [categoria, urgencia, impacto, zona, coherente] of tabla) {
    test(`${categoria} · ${urgencia} · ${impacto} en ${zona} → ${coherente ? "válida" : "incoherente"}`, () => {
      expect(esSugerenciaCoherente(sug(categoria, urgencia, impacto), zona)).toBe(coherente);
    });
  }

  test("impacto Alto solo en las tres zonas críticas (valor límite de la regla de zona)", () => {
    for (const zona of ["Perímetro exterior", "Sala de servidores", "Torre de control"]) {
      expect(esSugerenciaCoherente(sug("Equipo de campo averiado", "Media", "Alto"), zona)).toBe(true);
    }
    for (const zona of ["Almacén Norte", "Aparcamiento -1", "Recepción Principal"]) {
      expect(esSugerenciaCoherente(sug("Equipo de campo averiado", "Media", "Alto"), zona)).toBe(false);
    }
  });

  test("impacto Bajo es posible en cualquier zona salvo en una brecha (excepción «una persona»)", () => {
    expect(esSugerenciaCoherente(sug("Pérdida de registro o evidencia", "Media", "Bajo"), "Sala de servidores")).toBe(true);
    expect(esSugerenciaCoherente(sug("Brecha de seguridad activa", "Alta", "Bajo"), "Sala de servidores")).toBe(false);
  });

  test("categoría fuera de las 7 → incoherente", () => {
    expect(esSugerenciaCoherente(sug("Robo", "Alta", "Alto"), "Perímetro exterior")).toBe(false);
  });

  test("urgencia fuera del enum → incoherente", () => {
    expect(esSugerenciaCoherente(sug("Equipo de campo averiado", "Urgente", "Medio"), "Almacén Norte")).toBe(false);
  });

  test("motivo vacío o solo espacios → incoherente (principio 4)", () => {
    expect(esSugerenciaCoherente({ ...sug("Equipo de campo averiado", "Media", "Medio"), motivo: "   " }, "Almacén Norte")).toBe(false);
  });

  test("«Sin clasificar» solo es coherente con urgencia e impacto nulos (R1)", () => {
    expect(esSugerenciaCoherente({ categoria: "Sin clasificar", urgencia: null, impacto: null, motivo: MOTIVO }, "Almacén Norte")).toBe(true);
    expect(esSugerenciaCoherente({ categoria: "Sin clasificar", urgencia: "Alta", impacto: null, motivo: MOTIVO }, "Almacén Norte")).toBe(false);
  });
});
