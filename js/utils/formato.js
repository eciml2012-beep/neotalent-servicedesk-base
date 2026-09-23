// Funciones puras de formato. Sin estado, sin tocar el DOM.

export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

const fechaHora = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatearFechaHora = (iso) => fechaHora.format(new Date(iso));
