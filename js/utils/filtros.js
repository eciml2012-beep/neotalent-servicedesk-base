// Ordenar, filtrar y agrupar tickets ya derivados (ver estado-ticket.js). Puro, sin DOM.

import { SIN_CLASIFICAR, ESTADOS_TRIAJE } from "./constantes.js";

const ORDEN_PRIORIDAD = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };

function nivelPrioridad(p) {
  return p == null ? 4 : (ORDEN_PRIORIDAD[p] ?? 4);
}

// R4: Sin clasificar primero, luego el resto por prioridad, y al final los
// confirmados/corregidos. Se aplica dentro de cualquier vista que mezcle estados
// (punto 3 de la 2ª revisión QA).
function nivelOrden(t) {
  if (t.estadoTriaje !== ESTADOS_TRIAJE.PENDIENTE) return 2;
  return t.categoria === SIN_CLASIFICAR ? 0 : 1;
}

export function ordenarBandeja(tickets) {
  return [...tickets].sort((a, b) => {
    const nivel = nivelOrden(a) - nivelOrden(b);
    if (nivel !== 0) return nivel;
    return nivelPrioridad(a.prioridad) - nivelPrioridad(b.prioridad);
  });
}

// filtros: { estadoTriaje: "pendientes" | "todos" | "Confirmado" | "Corregido",
//            prioridad, sistema, zona, estado }
export function filtrarTickets(tickets, filtros = {}) {
  const estadoTriaje = filtros.estadoTriaje ?? "pendientes";
  return tickets.filter((t) => {
    if (estadoTriaje === "pendientes" && t.estadoTriaje !== ESTADOS_TRIAJE.PENDIENTE) return false;
    if (estadoTriaje !== "pendientes" && estadoTriaje !== "todos" && t.estadoTriaje !== estadoTriaje) return false;
    if (filtros.prioridad && t.prioridad !== filtros.prioridad) return false;
    if (filtros.sistema && t.sistema_afectado !== filtros.sistema) return false;
    if (filtros.zona && t.zona !== filtros.zona) return false;
    if (filtros.estado && t.estado !== filtros.estado) return false;
    return true;
  });
}

export function valoresUnicos(tickets, campo) {
  return [...new Set(tickets.map((t) => t[campo]))].sort();
}

export function calcularMetricas(tickets) {
  const porPrioridad = { Crítica: 0, Alta: 0, Media: 0, Baja: 0 };
  const porCategoria = {};
  let pendientes = 0;
  let confirmados = 0;
  let corregidos = 0;
  // R7: la tasa por categoría se agrupa por lo que SUGIRIÓ la IA, no por la categoría
  // final. Si la IA dice "Equipo averiado" y el operador lo pasa a "Brecha", el fallo
  // es de "Equipo averiado": es lo que el desglose tiene que dejar ver.
  const revisadosPorCategoria = {}; // categoría sugerida -> {confirmados, corregidos}

  for (const t of tickets) {
    if (t.prioridad) porPrioridad[t.prioridad] = (porPrioridad[t.prioridad] ?? 0) + 1;
    porCategoria[t.categoria] = (porCategoria[t.categoria] ?? 0) + 1;

    if (t.estadoTriaje === ESTADOS_TRIAJE.PENDIENTE) pendientes += 1;
    if (t.estadoTriaje === ESTADOS_TRIAJE.CONFIRMADO) confirmados += 1;
    if (t.estadoTriaje === ESTADOS_TRIAJE.CORREGIDO) corregidos += 1;

    if (t.estadoTriaje === ESTADOS_TRIAJE.CONFIRMADO || t.estadoTriaje === ESTADOS_TRIAJE.CORREGIDO) {
      const sugerida = t.sugerenciaEfectiva.categoria;
      const bucket = (revisadosPorCategoria[sugerida] ??= { confirmados: 0, corregidos: 0 });
      bucket[t.estadoTriaje === ESTADOS_TRIAJE.CONFIRMADO ? "confirmados" : "corregidos"] += 1;
    }
  }

  const revisados = confirmados + corregidos;
  const tasaCorreccion = revisados > 0 ? corregidos / revisados : null;

  const tasaPorCategoria = Object.fromEntries(
    Object.entries(revisadosPorCategoria).map(([cat, b]) => {
      const total = b.confirmados + b.corregidos;
      return [cat, total > 0 ? b.corregidos / total : null];
    })
  );

  return { porPrioridad, porCategoria, pendientes, confirmados, corregidos, tasaCorreccion, tasaPorCategoria };
}
