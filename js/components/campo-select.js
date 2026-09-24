// Select de un campo de formulario (Corregir: R5/R8; Nuevo ticket: R10). Antes había dos copias
// casi idénticas (ficha-ticket.js#crearSelectCorregir y nuevo-ticket.js#crearCampoSelect); se
// unifican aquí (auditoria-tecnica.md, sección 19, sugerencia 1).
//
// barra-filtros.js NO usa este ayudante: sus selects son filtros con una forma de dato distinta
// (pares {value, texto} y onChange(campo, valor)), no campos de un formulario — forzarlos en el
// mismo ayudante habría sido una abstracción de más para un parecido superficial.
export function crearCampoSelect({ etiqueta, valor, opciones, deshabilitado = false, notaBloqueo = null, onChange }) {
  const cont = document.createElement("div");
  const label = document.createElement("label");
  label.className = "dato__etiqueta";
  label.textContent = etiqueta;
  const select = document.createElement("select");
  select.className = "select-corregir";
  // aria-label explícito: si no, el nombre accesible del <select> concatena el texto de todas
  // sus opciones (bug real de R10, 24/09/2026: "Reportado por" colisionaba con "Zona" por la
  // opción "Coordinador de zona"), y un lector de pantalla leería todas las opciones como parte
  // del nombre del campo.
  select.setAttribute("aria-label", etiqueta);
  for (const op of opciones) {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    if (op === valor) option.selected = true;
    select.append(option);
  }
  select.disabled = deshabilitado;
  if (onChange) select.addEventListener("change", () => onChange(select.value));
  label.append(select);
  cont.append(label);
  if (notaBloqueo) {
    const nota = document.createElement("p");
    nota.className = "campo-corregir__nota";
    nota.textContent = notaBloqueo;
    cont.append(nota);
  }
  return { cont, select };
}
