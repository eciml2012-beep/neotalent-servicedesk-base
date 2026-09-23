// Combina un ticket original + lo guardado en localStorage en un solo objeto para pintar.
// Pure: no toca el DOM ni localStorage directamente (eso lo hace app.js).

import { SIN_CLASIFICAR, ESTADOS_TRIAJE } from "./constantes.js";
import { calcularPrioridad, esSugerenciaCoherente } from "./prioridad.js";

function sinClasificar(motivo, aviso = null) {
  return { categoria: SIN_CLASIFICAR, urgencia: null, impacto: null, motivo, aviso };
}

// Casos límite del spec. Todos acaban en "Sin clasificar" y ninguno rompe la bandeja,
// pero solo los que descartan una sugerencia llevan aviso en la fila (R8):
// - sin campo `sugerencia`: "no como error", sin aviso;
// - "Sin clasificar" con urgencia/impacto no nulos: se ignoran esos dos, sin aviso;
// - motivo vacío (principio 4), categoría fuera del enum o combinación imposible:
//   se descarta la sugerencia y se avisa. Nunca se enseña el motivo descartado.
function sugerenciaEfectivaDe(ticket) {
  const cruda = ticket.sugerencia;
  if (!cruda) return sinClasificar("No hay sugerencia de la IA para este ticket.");

  const motivo = typeof cruda.motivo === "string" ? cruda.motivo.trim() : "";
  if (!motivo) {
    return sinClasificar("La sugerencia de la IA no traía motivo y no se muestra (principio 4).", "Sugerencia descartada");
  }
  if (cruda.categoria === SIN_CLASIFICAR) return sinClasificar(cruda.motivo);
  if (!esSugerenciaCoherente(cruda, ticket.zona)) {
    return sinClasificar(
      `La IA sugirió «${cruda.categoria}» con urgencia ${cruda.urgencia} e impacto ${cruda.impacto} en ${ticket.zona}: no es una categoría o combinación válida (R8), así que se descarta.`,
      "Sugerencia descartada"
    );
  }
  return { categoria: cruda.categoria, urgencia: cruda.urgencia, impacto: cruda.impacto, motivo: cruda.motivo, aviso: null };
}

export function snapshotDeSugerencia(sugerencia) {
  return { categoria: sugerencia.categoria, urgencia: sugerencia.urgencia, impacto: sugerencia.impacto };
}

function snapshotCambio(snapshot, sugerenciaEfectiva) {
  if (!snapshot) return false;
  return (
    snapshot.categoria !== sugerenciaEfectiva.categoria ||
    snapshot.urgencia !== sugerenciaEfectiva.urgencia ||
    snapshot.impacto !== sugerenciaEfectiva.impacto
  );
}

// R6 (puntos 10 y 11 de la 2ª revisión QA): si la sugerencia cambió desde que se
// confirmó (Claude Code la regeneró), la confirmación guardada se invalida.
export function derivarTicket(ticketOriginal, triajeGuardado) {
  const sugerenciaEfectiva = sugerenciaEfectivaDe(ticketOriginal);
  const triajeValido =
    triajeGuardado && !snapshotCambio(triajeGuardado.sugerenciaSnapshot, sugerenciaEfectiva)
      ? triajeGuardado
      : null;

  const estadoTriaje = triajeValido ? triajeValido.estado : ESTADOS_TRIAJE.PENDIENTE;
  const categoria = triajeValido ? triajeValido.categoria : sugerenciaEfectiva.categoria;
  const urgencia = triajeValido ? triajeValido.urgencia : sugerenciaEfectiva.urgencia;
  const impacto = triajeValido ? triajeValido.impacto : sugerenciaEfectiva.impacto;

  return {
    ...ticketOriginal,
    sugerenciaEfectiva,
    triaje: triajeValido,
    estadoTriaje,
    categoria,
    urgencia,
    impacto,
    prioridad: calcularPrioridad(urgencia, impacto),
    esSugerido: !triajeValido, // C2: sin confirmar se pinta atenuado y con "sugerido"
    motivo: sugerenciaEfectiva.motivo, // R4: el motivo se ve siempre, confirmado o no
    avisoSugerencia: sugerenciaEfectiva.aviso,
  };
}

// R5 + R7: "Corregido" se mide contra la sugerencia de la IA, no contra el último
// valor guardado. Si no, reabrir un Corregido y guardarlo tal cual lo pasaría a
// Confirmado, y la tasa de corrección diría que la IA acertó cuando no fue así.
export function estadoAlGuardar(sugerenciaEfectiva, valores) {
  const igual =
    valores.categoria === sugerenciaEfectiva.categoria &&
    valores.urgencia === sugerenciaEfectiva.urgencia &&
    valores.impacto === sugerenciaEfectiva.impacto;
  return igual ? ESTADOS_TRIAJE.CONFIRMADO : ESTADOS_TRIAJE.CORREGIDO;
}
