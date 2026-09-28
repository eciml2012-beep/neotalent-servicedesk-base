// Nivel: unitario. Técnica: tabla de decisión (categoría → urgencia/impacto, R2/R8) y valores
// límite del motivo (≥ 40). Base: spec R10, constitución (enmienda del principio 1).
import { test, expect } from "@playwright/test";
import { clasificarTicketNuevo } from "../../js/utils/clasificador-nuevo-ticket.js";

test.describe("R10 · clasificador de reglas fijas (no IA)", { tag: ["@R10"] }, () => {
  test("ninguna palabra clave conocida → Sin clasificar, con motivo ≥ 40 caracteres", () => {
    const r = clasificarTicketNuevo({ titulo: "Cosa rara", descripcion: "Pasó algo que no sé explicar bien del todo.", zona: "Muelle de carga" });
    expect(r.categoria).toBe("Sin clasificar");
    expect(r.urgencia).toBeNull();
    expect(r.impacto).toBeNull();
    expect(r.motivo.length).toBeGreaterThanOrEqual(40);
  });

  // Los 4 tickets de cámara del dataset (SVD-4113, 4128, 4143, 4158) quedaron «Sin clasificar»
  // porque decían "sin grabar" y la regla solo tenía "no está grabando": mismo sentido, otro texto.
  test("«sin grabar» en zona crítica → Equipo de campo averiado, Media, Alto", () => {
    const r = clasificarTicketNuevo({ titulo: "Cámara 8 sin grabar en Perímetro exterior", descripcion: "La cámara 8 lleva 19 días sin grabar, solo muestra pantalla en negro.", zona: "Perímetro exterior" });
    expect(r).toMatchObject({ categoria: "Equipo de campo averiado", urgencia: "Media", impacto: "Alto" });
  });

  test("«pantalla en negro» en zona no crítica → Equipo de campo averiado, Media, Medio", () => {
    const r = clasificarTicketNuevo({ titulo: "Cámara 10 caída", descripcion: "La cámara solo muestra pantalla en negro desde ayer.", zona: "Aparcamiento -1" });
    expect(r).toMatchObject({ categoria: "Equipo de campo averiado", urgencia: "Media", impacto: "Medio" });
  });

  test("«desactivada» en zona crítica → Brecha de seguridad activa, Alta, Alto", () => {
    const r = clasificarTicketNuevo({ titulo: "Alarma desactivada", descripcion: "La alarma quedó desactivada tras el mantenimiento de hoy.", zona: "Sala de servidores" });
    expect(r).toMatchObject({ categoria: "Brecha de seguridad activa", urgencia: "Alta", impacto: "Alto" });
  });

  test("brecha en zona no crítica: nunca impacto Bajo (R2, excepción de las brechas)", () => {
    const r = clasificarTicketNuevo({ titulo: "Puerta sin vigilar", descripcion: "La puerta de emergencia quedó abierta sin alarma toda la noche.", zona: "Muelle de carga" });
    expect(r.categoria).toBe("Brecha de seguridad activa");
    expect(r.impacto).toBe("Medio");
  });

  test("«su tarjeta» → impacto Bajo aunque la zona sea crítica (afecta a una persona)", () => {
    const r = clasificarTicketNuevo({ titulo: "Alta de acceso", descripcion: "Hay que dar de alta un perfil de acceso nuevo: su tarjeta llega mañana.", zona: "Sala de servidores" });
    expect(r.categoria).toBe("Petición de acceso");
    expect(r.impacto).toBe("Bajo");
  });

  test("motivo cita que es una regla fija, no una IA", () => {
    const r = clasificarTicketNuevo({ titulo: "Lector averiado", descripcion: "El lector de tarjetas no responde desde esta mañana en el acceso.", zona: "Acceso peatonal Este" });
    expect(r.motivo.toLowerCase()).toContain("regla fija");
    expect(r.motivo.toLowerCase()).not.toContain(" ia ");
  });
});
