// R10: sugerencia de un ticket creado a mano en el navegador. Reglas fijas de palabras clave,
// no una IA (constitución, enmienda del principio 1, 24/09/2026): función pura más de js/utils/,
// sin estado y sin tocar el DOM. Reutiliza la matriz de urgencia/impacto de R2 y R8.
import { SIN_CLASIFICAR, ZONAS_CRITICAS } from "./constantes.js";

// Orden importa: la primera regla que encuentre una palabra clave en el texto decide la
// categoría. Urgencia según R2 (qué señal observable hay en el texto).
// NO añadir claves para «cámara sin grabar / pantalla en negro»: ese patrón se queda en
// «Sin clasificar» a propósito (decisión cerrada del 23/09/2026, docs/categorias-triaje.md).
// El texto no permite decidir si el equipo falla o si solo ha dejado de guardar.
const REGLAS = [
  { categoria: "Brecha de seguridad activa", claves: ["sin vigilar", "desactivada", "sin revocar", "abierta sin alarma", "no está grabando", "no esta grabando", "sigue activa"], urgencia: "Alta" },
  { categoria: "Equipo de campo averiado", claves: ["no responde", "averiado", "no funciona", "tarda más de", "tarda mas de", "lento", "sin respuesta"], urgencia: "Media" },
  { categoria: "Pérdida de registro o evidencia", claves: ["no registrado", "doble fichaje", "no guarda", "no se guardó", "no se guardo", "checkpoint", "corte de grabación", "corte de grabacion"], urgencia: "Media" },
  { categoria: "Fallo de integración entre sistemas", claves: ["no sincronizado", "sin sincronizar", "no llega a", "no se ha sincronizado"], urgencia: "Media" },
  { categoria: "Falsa alarma recurrente", claves: ["sin causa aparente", "salta sin causa", "falsa alarma"], urgencia: "Baja" },
  { categoria: "Petición de información", claves: ["solicitud de histórico", "solicitud de historico", "solicita el histórico", "solicita el historico"], urgencia: "Baja" },
  { categoria: "Petición de acceso", claves: ["alta de acceso", "perfil de acceso", "acceso temporal", "acceso nuevo", "permiso nuevo"], urgencia: "Baja" },
];

// R2: impacto Bajo si el texto describe a una sola persona (su credencial, su alta, su fichaje).
const CLAVES_UNA_PERSONA = ["su tarjeta", "su credencial", "un guardia nuevo", "un empleado", "a un guardia", "un proveedor externo", "del mismo guardia"];

// R2: un equipo o un enlace caídos dejan sin servicio a cualquiera que los use, así que nombrar a
// una persona en el texto no los convierte en impacto Bajo — ahí manda la zona («un lector de
// tarjetas que deja de reconocer a cualquiera no es una persona», spec R2).
const CATEGORIAS_SIN_EXCEPCION_PERSONA = ["Equipo de campo averiado", "Fallo de integración entre sistemas"];

function impactoDe(categoria, zona, texto) {
  if (categoria === "Brecha de seguridad activa") return ZONAS_CRITICAS.includes(zona) ? "Alto" : "Medio";
  if (!CATEGORIAS_SIN_EXCEPCION_PERSONA.includes(categoria) && CLAVES_UNA_PERSONA.some((c) => texto.includes(c))) return "Bajo";
  return ZONAS_CRITICAS.includes(zona) ? "Alto" : "Medio";
}

/** { categoria, urgencia, impacto, motivo }, con las mismas reglas de R1/R2/R8. */
export function clasificarTicketNuevo({ titulo, descripcion, zona }) {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  const regla = REGLAS.find((r) => r.claves.some((c) => texto.includes(c)));

  if (!regla) {
    return {
      categoria: SIN_CLASIFICAR,
      urgencia: null,
      impacto: null,
      motivo: "El clasificador de reglas fijas no encontró ninguna palabra clave conocida en el título ni en la descripción de este ticket nuevo: requiere clasificación manual.",
    };
  }

  const impacto = impactoDe(regla.categoria, zona, texto);
  return {
    categoria: regla.categoria,
    urgencia: regla.urgencia,
    impacto,
    motivo: `Clasificado por regla fija: el texto contiene una palabra clave de «${regla.categoria}» (${zona}). Sugerencia automática, no generada por IA: revísala antes de confirmar.`,
  };
}
