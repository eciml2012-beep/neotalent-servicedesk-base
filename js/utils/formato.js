// Funciones puras de formato. Sin estado, sin tocar el DOM.

export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

// AAAA-MM-DD en la zona del operador. toISOString() da la fecha UTC: entre las 00:00 y las
// 02:00 en España el export salía con la fecha del día anterior (R6).
export const fechaLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fechaHora = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatearFechaHora = (iso) => fechaHora.format(new Date(iso));
