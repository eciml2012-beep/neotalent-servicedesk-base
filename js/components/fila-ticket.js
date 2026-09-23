// Una fila de la bandeja. Recibe el ticket ya derivado (utils/estado-ticket.js) por
// parámetro; no hace fetch ni lee localStorage.

function slug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

function crearBadge(texto, { sugerido = false, claseTono = "" } = {}) {
  const span = document.createElement("span");
  span.className = `badge ${claseTono} ${sugerido ? "badge--sugerido" : "badge--solido"}`.trim();
  span.textContent = sugerido ? `${texto} · sugerido` : texto;
  return span;
}

export function crearFilaTicket(ticket, { onAbrir } = {}) {
  const fila = document.createElement("button");
  fila.type = "button";
  // Decisión 4 del spec: un "Sin clasificar" pendiente sale destacado para revisión.
  const destacado = ticket.categoria === "Sin clasificar" && ticket.esSugerido;
  fila.className = destacado ? "fila-ticket fila-ticket--destacada" : "fila-ticket";
  fila.dataset.id = ticket.id;

  const id = document.createElement("span");
  id.className = "fila-ticket__id";
  id.textContent = ticket.id;

  const tituloCol = document.createElement("div");
  tituloCol.className = "fila-ticket__titulo-col";
  const titulo = document.createElement("div");
  titulo.className = "fila-ticket__titulo";
  titulo.textContent = ticket.titulo;
  const motivo = document.createElement("div");
  // R8 / casos límite: si la sugerencia se descartó, la fila lo dice en vez de
  // enseñar un motivo como si fuera válido.
  motivo.className = ticket.avisoSugerencia ? "fila-ticket__motivo fila-ticket__motivo--aviso" : "fila-ticket__motivo";
  motivo.textContent = ticket.avisoSugerencia ? `⚠ ${ticket.avisoSugerencia}: ${ticket.motivo}` : `Motivo IA: ${ticket.motivo}`;
  tituloCol.append(titulo, motivo);

  const categoriaCol = document.createElement("div");
  categoriaCol.append(
    crearBadge(ticket.categoria, {
      sugerido: ticket.esSugerido,
      claseTono: ticket.categoria === "Brecha de seguridad activa" ? "badge--brecha" : "",
    })
  );

  const prioridadCol = document.createElement("div");
  if (ticket.prioridad) {
    prioridadCol.append(
      crearBadge(ticket.prioridad, {
        sugerido: ticket.esSugerido,
        claseTono: `badge--prioridad-${slug(ticket.prioridad)}`,
      })
    );
  } else {
    const span = document.createElement("span");
    span.className = "fila-ticket__sin-prioridad";
    span.textContent = "— sin prioridad";
    prioridadCol.append(span);
  }

  const estadoCol = document.createElement("div");
  estadoCol.className = "fila-ticket__estado-col";
  const estadoBadge = document.createElement("span");
  estadoBadge.className = `badge badge--estado badge--estado-${slug(ticket.estadoTriaje)}`;
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
