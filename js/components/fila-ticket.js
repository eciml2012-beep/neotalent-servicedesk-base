// Una fila de la bandeja. Recibe el ticket ya derivado (utils/estado-ticket.js) por
// parámetro; no hace fetch ni lee localStorage.

function crearBadge(texto, { sugerido = false, claseTono = "" } = {}) {
  const span = document.createElement("span");
  span.className = `badge ${claseTono} ${sugerido ? "badge--sugerido" : "badge--solido"}`.trim();
  span.textContent = sugerido ? `${texto} · sugerido` : texto;
  return span;
}

// `seleccionado`: el ticket abierto al lado (vista C). `tabulable`: la única fila que recibe Tab
// (roving tabindex); las demás se alcanzan con las flechas.
export function crearFilaTicket(ticket, { onAbrir, seleccionado = false, tabulable = true } = {}) {
  const fila = document.createElement("button");
  fila.type = "button";
  // Decisión 4 del spec: un "Sin clasificar" pendiente sale destacado para revisión.
  const destacado = ticket.categoria === "Sin clasificar" && ticket.esSugerido;
  fila.className = destacado ? "fila-ticket fila-ticket--destacada" : "fila-ticket";
  fila.dataset.id = ticket.id;
  fila.setAttribute("aria-current", String(seleccionado));
  fila.tabIndex = tabulable ? 0 : -1;

  const id = document.createElement("span");
  id.className = "fila-ticket__id";
  id.textContent = ticket.id;

  const tituloCol = document.createElement("div");
  tituloCol.className = "fila-ticket__principal";
  const titulo = document.createElement("div");
  titulo.className = "fila-ticket__titulo";
  titulo.textContent = ticket.titulo;
  const motivo = document.createElement("div");
  // R8 / casos límite: si la sugerencia se descartó, la fila lo dice en vez de
  // enseñar un motivo como si fuera válido.
  const { motivo: texto, aviso } = ticket.sugerenciaEfectiva;
  motivo.className = aviso ? "fila-ticket__motivo fila-ticket__motivo--aviso" : "fila-ticket__motivo";
  motivo.textContent = aviso ? `⚠ ${aviso}: ${texto}` : `Motivo IA: ${texto}`;
  // La fila recorta el motivo a 2 líneas (CSS); el texto entero sigue en el DOM y al pasar el ratón.
  motivo.title = motivo.textContent;
  tituloCol.append(titulo, motivo);

  const categoriaCol = document.createElement("div");
  categoriaCol.className = "fila-ticket__categoria";
  categoriaCol.append(
    crearBadge(ticket.categoria, {
      sugerido: ticket.esSugerido,
      claseTono: ticket.categoria === "Brecha de seguridad activa" ? "badge--brecha" : "",
    })
  );

  const prioridadCol = document.createElement("div");
  prioridadCol.className = "fila-ticket__prioridad";
  if (ticket.prioridad) {
    // Prioridad por peso, no por color (diseno.md, rediseño 24/09/2026).
    const peso = { "Crítica": "critica", Alta: "alta", Media: "media", Baja: "baja" }[ticket.prioridad];
    prioridadCol.append(crearBadge(ticket.prioridad, { sugerido: ticket.esSugerido, claseTono: `badge--prio-${peso}` }));
  } else {
    const span = document.createElement("span");
    span.className = "fila-ticket__sin-prioridad";
    span.textContent = "— sin prioridad";
    prioridadCol.append(span);
  }

  const estadoCol = document.createElement("div");
  estadoCol.className = "fila-ticket__estado-col";
  const estadoBadge = document.createElement("span");
  estadoBadge.className = ticket.esSugerido ? "badge badge--estado" : "badge badge--estado badge--estado-revisado";
  estadoBadge.textContent = ticket.estadoTriaje;
  estadoCol.append(estadoBadge);
  if (ticket.estado === "cerrado") {
    const cerrado = document.createElement("span");
    cerrado.className = "fila-ticket__cerrado";
    cerrado.textContent = "cerrado";
    estadoCol.append(cerrado);
  }

  fila.append(id, tituloCol, categoriaCol, prioridadCol, estadoCol);
  fila.addEventListener("click", () => onAbrir?.(ticket.id));
  return fila;
}
