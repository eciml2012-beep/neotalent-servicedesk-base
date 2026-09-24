// R10: formulario para crear un ticket a mano. Recibe los enums y devuelve el ticket por
// callback; no hace fetch ni lee/escribe localStorage (eso lo hace app.js).
import { SISTEMAS, REPORTADO_POR, ZONAS, LIMITES_TITULO, LIMITES_DESCRIPCION } from "../utils/constantes.js";
import { crearCampoTexto } from "./campo-texto.js";

function crearCampoSelect(etiqueta, opciones) {
  const label = document.createElement("label");
  label.className = "dato__etiqueta";
  label.textContent = etiqueta;
  const select = document.createElement("select");
  select.className = "select-corregir";
  // aria-label explícito: si no, el nombre accesible del <select> concatena el texto de todas
  // sus opciones (aquí "Reportado por" incluye la opción "Coordinador de zona" y ambigua con
  // "Zona"), y un lector de pantalla leería las 12 opciones como parte del nombre del campo.
  select.setAttribute("aria-label", etiqueta);
  for (const op of opciones) {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    select.append(option);
  }
  label.append(select);
  return { label, select };
}

export function crearFormularioNuevoTicket({ onCrear, onCancelar }) {
  const dialogo = document.createElement("div");
  dialogo.className = "modal";
  dialogo.setAttribute("role", "dialog");
  dialogo.setAttribute("aria-label", "Nuevo ticket");

  const caja = document.createElement("div");
  caja.className = "modal__caja";
  const titulo = document.createElement("h2");
  titulo.className = "panel__titulo";
  titulo.textContent = "Nuevo ticket";
  caja.append(titulo);

  const { label: labelSistema, select: selectSistema } = crearCampoSelect("Sistema afectado", SISTEMAS);
  const { label: labelReportado, select: selectReportado } = crearCampoSelect("Reportado por", REPORTADO_POR);
  const { label: labelZona, select: selectZona } = crearCampoSelect("Zona", ZONAS);

  const crear = document.createElement("button");
  crear.type = "button";
  crear.className = "boton boton--primario";
  crear.textContent = "Crear ticket";
  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.className = "boton boton--fantasma";
  cancelar.textContent = "Cancelar";
  cancelar.addEventListener("click", () => onCancelar?.());

  // Cada campo se valida solo (crearCampoTexto); aquí solo se combinan los dos resultados.
  function pintarCrear() {
    crear.disabled = Boolean(campoTitulo.validar().error || campoDesc.validar().error);
  }
  const campoTitulo = crearCampoTexto({ etiqueta: "Título", limites: LIMITES_TITULO, filas: 2, onInput: pintarCrear });
  const campoDesc = crearCampoTexto({ etiqueta: "Descripción", limites: LIMITES_DESCRIPCION, filas: 4, onInput: pintarCrear });
  pintarCrear();

  crear.addEventListener("click", () => {
    const t = campoTitulo.validar();
    const d = campoDesc.validar();
    if (t.error || d.error) return;
    onCrear?.({
      titulo: t.texto,
      descripcion: d.texto,
      sistema_afectado: selectSistema.value,
      reportado_por: selectReportado.value,
      zona: selectZona.value,
    });
  });

  const acciones = document.createElement("div");
  acciones.className = "ficha__acciones";
  acciones.append(crear, cancelar);

  caja.append(campoTitulo.cont, campoDesc.cont, labelSistema, labelReportado, labelZona, acciones);
  dialogo.append(caja);
  return dialogo;
}
