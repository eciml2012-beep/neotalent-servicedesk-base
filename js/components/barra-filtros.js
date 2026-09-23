// Barra de filtros de la bandeja (estado del triaje, prioridad, sistema, zona, estado).
// Recibe los valores posibles y el estado actual por parámetro; avisa por onChange.

function crearSelect({ etiqueta, campo, opciones, valorActual, onChange }) {
  const select = document.createElement("select");
  select.className = "filtro-select";
  select.setAttribute("aria-label", etiqueta);
  select.dataset.campo = campo;

  for (const { value, texto } of opciones) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = texto;
    if (value === (valorActual ?? "")) option.selected = true;
    select.append(option);
  }

  select.addEventListener("change", () => onChange(campo, select.value || null));
  return select;
}

export function crearBarraFiltros({ sistemas, zonas, filtros, onChange }) {
  const cont = document.createElement("div");
  cont.className = "barra-filtros";

  const label = document.createElement("span");
  label.className = "barra-filtros__label";
  label.textContent = "Filtros:";
  cont.append(label);

  cont.append(
    crearSelect({
      etiqueta: "Estado del triaje",
      campo: "estadoTriaje",
      opciones: [
        { value: "pendientes", texto: "Estado triaje: Pendientes de confirmar" },
        { value: "Confirmado", texto: "Estado triaje: Confirmados" },
        { value: "Corregido", texto: "Estado triaje: Corregidos" },
        { value: "todos", texto: "Estado triaje: Todos" },
      ],
      valorActual: filtros.estadoTriaje ?? "pendientes",
      onChange,
    }),
    crearSelect({
      etiqueta: "Prioridad",
      campo: "prioridad",
      opciones: [
        { value: "", texto: "Prioridad: todas" },
        { value: "Crítica", texto: "Crítica" },
        { value: "Alta", texto: "Alta" },
        { value: "Media", texto: "Media" },
        { value: "Baja", texto: "Baja" },
      ],
      valorActual: filtros.prioridad,
      onChange,
    }),
    crearSelect({
      etiqueta: "Sistema afectado",
      campo: "sistema",
      opciones: [{ value: "", texto: "Sistema: todos" }, ...sistemas.map((s) => ({ value: s, texto: s }))],
      valorActual: filtros.sistema,
      onChange,
    }),
    crearSelect({
      etiqueta: "Zona",
      campo: "zona",
      opciones: [{ value: "", texto: "Zona: todas" }, ...zonas.map((z) => ({ value: z, texto: z }))],
      valorActual: filtros.zona,
      onChange,
    }),
    crearSelect({
      etiqueta: "Estado del ticket",
      campo: "estado",
      opciones: [
        { value: "", texto: "Estado ticket: todos" },
        { value: "abierto", texto: "Abierto" },
        { value: "cerrado", texto: "Cerrado" },
      ],
      valorActual: filtros.estado,
      onChange,
    })
  );

  return cont;
}
