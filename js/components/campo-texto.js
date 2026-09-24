// Campo de texto libre del operador, reutilizado por la ficha (R9: notas, motivo de corrección)
// y por "Nuevo ticket" (R10: título, descripción). El aviso de datos personales va siempre a la
// vista (principio 3) y el error explica por qué no se puede guardar.
import { AVISO_DATOS_PERSONALES } from "../utils/constantes.js";
import { validarTextoOperador } from "../utils/texto-operador.js";

let siguienteId = 0;

export function crearCampoTexto({ etiqueta, valor = "", limites, filas, onInput }) {
  const cont = document.createElement("div");
  cont.className = "campo-texto";
  const idAviso = `campo-texto-aviso-${++siguienteId}`;

  const label = document.createElement("label");
  label.className = "dato__etiqueta";
  label.textContent = etiqueta;
  const area = document.createElement("textarea");
  area.className = "campo-texto__area";
  area.rows = filas;
  area.maxLength = limites.max;
  area.value = valor;
  area.setAttribute("aria-describedby", idAviso);
  label.append(area);

  const aviso = document.createElement("p");
  aviso.id = idAviso;
  aviso.className = "campo-corregir__nota";
  const error = document.createElement("p");
  error.className = "campo-texto__error";
  error.setAttribute("aria-live", "polite");

  function validar() {
    const resultado = validarTextoOperador(area.value, limites);
    aviso.textContent = `${AVISO_DATOS_PERSONALES} ${resultado.texto.length}/${limites.max}.`;
    // Un campo vacío no es un error que haya que gritar: basta con el botón deshabilitado.
    error.textContent = resultado.texto && resultado.error ? resultado.error : "";
    return resultado;
  }
  area.addEventListener("input", () => onInput?.(validar()));
  validar();

  cont.append(label, aviso, error);
  return { cont, validar };
}
