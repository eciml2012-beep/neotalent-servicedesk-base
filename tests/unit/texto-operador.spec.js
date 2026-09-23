// Nivel: unitario. Técnicas: particiones de equivalencia y valores límite (largos de R9),
// tabla de casos (formas de dato personal). Base: spec R9 y constitución P3 (enmienda 23/09/2026).
import { test, expect } from "@playwright/test";
import { pareceDatoPersonal, validarTextoOperador, unirNotas } from "../../js/utils/texto-operador.js";
import { LIMITES_NOTA, LIMITES_MOTIVO_CORRECCION } from "../../js/utils/constantes.js";

test.describe("R9 · datos personales en el texto del operador", { tag: ["@R9", "@P3"] }, () => {
  // Valores inventados: tienen la forma, no son de nadie (principio 3, también en pruebas).
  for (const [texto, tipo] of [
    ["llamó el de 12345678Z", "un DNI"],
    ["dni 12345678-z", "un DNI"],
    ["NIE X1234567L en recepción", "un NIE"],
    ["Y 1234567 L", "un NIE"], // con espacios también (R9)
    ["a 1234567 l", null], // 7 cifras sin X, Y o Z delante: ni DNI ni NIE
    ["furgoneta 1234 BCD en el muelle", "una matrícula"],
    ["matrícula 1234-bcd", "una matrícula"],
    ["1234 ABC", null], // la A es vocal: las matrículas actuales no llevan vocales
    ["ticket SVD-4104 revisado", null],
    ["checkpoint 10 a las 22:30 del 2026-09-03", null],
  ]) {
    test(`«${texto}» → ${tipo ?? "nada"}`, () => expect(pareceDatoPersonal(texto)).toBe(tipo));
  }
});

test.describe("R9 · largos y validación", { tag: ["@R9"] }, () => {
  test("nota: vacía o solo espacios no se guarda", () => {
    expect(validarTextoOperador("   ", LIMITES_NOTA).error).toBeTruthy();
  });

  test("nota: 1 carácter vale; 500 vale; 501 no (valores límite)", () => {
    expect(validarTextoOperador("x", LIMITES_NOTA).error).toBeNull();
    expect(validarTextoOperador("x".repeat(500), LIMITES_NOTA).error).toBeNull();
    expect(validarTextoOperador("x".repeat(501), LIMITES_NOTA).error).toMatch(/500/);
  });

  test("motivo de corrección: 9 caracteres no; 10 sí; los espacios de los extremos no cuentan", () => {
    expect(validarTextoOperador("123456789", LIMITES_MOTIVO_CORRECCION).error).toMatch(/10/);
    expect(validarTextoOperador("abcdefghij", LIMITES_MOTIVO_CORRECCION).error).toBeNull();
    expect(validarTextoOperador("   abcdefghi   ", LIMITES_MOTIVO_CORRECCION).error).toMatch(/10/);
  });

  test("devuelve el texto recortado", () => {
    expect(validarTextoOperador("  hola  ", LIMITES_NOTA).texto).toBe("hola");
  });

  test("un DNI no se guarda aunque el largo sea válido, y el error lo dice", () => {
    expect(validarTextoOperador("Me lo dijo el 12345678Z", LIMITES_NOTA).error).toMatch(/DNI.*principio 3/);
  });
});

test.describe("R9 · unir notas al reimportar (decisión 31)", { tag: ["@R9", "@R6"] }, () => {
  const a = { texto: "primera", fecha: "2026-09-20T10:00:00.000Z" };
  const b = { texto: "segunda", fecha: "2026-09-21T10:00:00.000Z" };

  test("misma fecha y texto es la misma nota: no se duplica", () => {
    expect(unirNotas([a, b], [a])).toEqual([a, b]);
  });

  test("el resultado queda en orden cronológico", () => {
    expect(unirNotas([b], [a])).toEqual([a, b]);
  });

  test("mismo texto en otra fecha son dos notas", () => {
    const otra = { ...a, fecha: "2026-09-22T10:00:00.000Z" };
    expect(unirNotas([a], [otra])).toHaveLength(2);
  });

  test("sin listas devuelve una lista vacía", () => expect(unirNotas()).toEqual([]));
});
