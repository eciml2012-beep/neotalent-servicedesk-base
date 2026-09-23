// Combina un ticket original + lo guardado en localStorage en un solo objeto para pintar.
// Pure: no toca el DOM ni localStorage directamente (eso lo hace app.js).

import { SIN_CLASIFICAR, ESTADOS_TRIAJE } from "./constantes.js";
import { calcularPrioridad, esSugerenciaCoherente } from "./prioridad.js";

// R1 caso límite: sin sugerencia, categoría fuera del enum, motivo vacío o
// incoherente (R8) -> se trata como "Sin clasificar", nunca rompe la bandeja.
function sugerenciaEfectivaDe(ticket) {
  const cruda = ticket.sugerencia ?? null;
  if (cruda && esSugerenciaCoherente(cruda, ticket.zona)) return cruda;
  return {
    categoria: SIN_CLASIFICAR,
    urgencia: null,
    impacto: null,
    motivo: cruda?.motivo?.trim()
      ? cruda.motivo
      : "No hay una sugerencia válida de la IA para este ticket.",
  };
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
  };
}
