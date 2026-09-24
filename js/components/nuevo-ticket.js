// R10: formulario para crear un ticket a mano. Recibe los enums y devuelve el ticket por
// callback; no hace fetch ni lee/escribe localStorage (eso lo hace app.js).
import { SISTEMAS, REPORTADO_POR, ZONAS, LIMITES_TITULO, LIMITES_DESCRIPCION } from "../utils/constantes.js";
import { crearCampoTexto } from "./campo-texto.js";
import { crearCampoSelect } from "./campo-select.js";

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

  const { cont: contSistema, select: selectSistema } = crearCampoSelect({ etiqueta: "Sistema afectado", opciones: SISTEMAS });
  const { cont: contReportado, select: selectReportado } = crearCampoSelect({ etiqueta: "Reportado por", opciones: REPORTADO_POR });
  const { cont: contZona, select: selectZona } = crearCampoSelect({ etiqueta: "Zona", opciones: ZONAS });

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

  caja.append(campoTitulo.cont, campoDesc.cont, contSistema, contReportado, contZona, acciones);
  dialogo.append(caja);
  return dialogo;
}
