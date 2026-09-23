// Ficha de un ticket: modo "ver" (sugerencia + Aceptar/Corregir/Deshacer fuera de la
// caja) y modo "corregir" (desplegables + Guardar/Cancelar). Recibe datos por
// parámetro, no hace fetch ni lee localStorage.

import { CATEGORIAS, SIN_CLASIFICAR, URGENCIAS, IMPACTOS } from "../utils/constantes.js";
import { calcularPrioridad, urgenciasPermitidas } from "../utils/prioridad.js";
import { formatearFecha } from "../utils/formato.js";

function fila(etiqueta, valor) {
  const div = document.createElement("div");
  const et = document.createElement("div");
  et.className = "dato__etiqueta";
  et.textContent = etiqueta;
  const val = document.createElement("div");
  val.className = "dato__valor";
  val.textContent = valor;
  div.append(et, val);
  return div;
}

function crearCabecera(ticket, { onVolver, extra } = {}) {
  const cabecera = document.createElement("div");
  cabecera.className = "ficha__cabecera";

  const volver = document.createElement("button");
  volver.type = "button";
  volver.className = "boton boton--fantasma";
  volver.textContent = "← Bandeja";
  volver.addEventListener("click", () => onVolver?.());

  const id = document.createElement("span");
  id.className = "ficha__id";
  id.textContent = ticket.id;

  const titulo = document.createElement("span");
  titulo.className = "ficha__titulo";
  titulo.textContent = ticket.titulo;

  cabecera.append(volver, id, titulo);

  if (extra) {
    cabecera.append(extra);
  } else {
    // docs/diseno.md: ámbar para abierto, verde azulado para cerrado.
    const estado = document.createElement("span");
    estado.className = `ficha__estado-ticket ficha__estado-ticket--${ticket.estado}`;
    estado.textContent = ticket.estado;
    cabecera.append(estado);
  }
  return cabecera;
}

function crearPanelDatos(ticket, zonasCriticas) {
  const panel = document.createElement("div");
  panel.className = "panel";

  const titulo = document.createElement("div");
  titulo.className = "panel__titulo";
  titulo.textContent = "DATOS DEL TICKET";
  panel.append(titulo);

  const cuerpo = document.createElement("div");
  cuerpo.className = "panel__cuerpo";

  const descripcion = fila("Descripción", ticket.descripcion);
  const grid = document.createElement("div");
  grid.className = "panel__grid";

  const zonaValor = zonasCriticas.includes(ticket.zona) ? `${ticket.zona} (zona crítica)` : ticket.zona;
  grid.append(
    fila("Sistema afectado", ticket.sistema_afectado),
    fila("Zona", zonaValor),
    fila("Reportado por", ticket.reportado_por),
    fila("Fecha", formatearFecha(ticket.fecha))
  );

  cuerpo.append(descripcion, grid);
  panel.append(cuerpo);
  return panel;
}

// Modo "ver": la sugerencia (o lo ya confirmado) dentro de la caja delimitada;
// Aceptar/Corregir/Deshacer fuera (docs/diseno.md, la regla que de verdad importa).
function crearCajaSugerencia(ticket) {
  const caja = document.createElement("div");
  const confirmado = ticket.estadoTriaje !== "Pendiente de confirmar";
  caja.className = `caja-ia ${confirmado ? "caja-ia--confirmada" : "caja-ia--pendiente"}`;

  const cabecera = document.createElement("div");
  cabecera.className = "caja-ia__cabecera";
  const { aviso } = ticket.sugerenciaEfectiva;
  cabecera.textContent = confirmado
    ? `CLASIFICACIÓN · ${ticket.estadoTriaje}`
    : aviso
    ? `SUGERENCIA DE LA IA · ${aviso.toLowerCase()}`
    : "SUGERENCIA DE LA IA · sin confirmar";
  caja.append(cabecera);

  const grid = document.createElement("div");
  grid.className = "panel__grid";
  grid.append(
    fila("Categoría", ticket.categoria),
    fila("Prioridad (matriz)", ticket.prioridad ?? "—"),
    fila("Urgencia", ticket.urgencia ?? "—"),
    fila("Impacto", ticket.impacto ?? "—")
  );
  caja.append(grid);

  const motivo = document.createElement("div");
  motivo.className = "caja-ia__motivo";
  motivo.append(fila(aviso ? "Aviso" : "Motivo de la IA", ticket.sugerenciaEfectiva.motivo));
  // Principio 1: tras una corrección, lo que propuso la IA sigue a la vista.
  if (ticket.estadoTriaje === "Corregido") {
    const s = ticket.sugerenciaEfectiva;
    const original = [s.categoria, s.urgencia, s.impacto].filter(Boolean).join(" · ");
    motivo.append(fila("Sugerencia original de la IA", original));
  }
  caja.append(motivo);

  const nota = document.createElement("div");
  nota.className = "caja-ia__nota";
  nota.textContent = "La prioridad la calcula la app a partir de urgencia × impacto; no se sugiere ni se edita a mano.";
  caja.append(nota);

  return caja;
}

function crearAcciones(ticket, { onAceptar, onCorregir, onDeshacer }) {
  const barra = document.createElement("div");
  barra.className = "ficha__acciones";

  const puedeAceptar = ticket.estadoTriaje === "Pendiente de confirmar" && ticket.categoria !== SIN_CLASIFICAR;
  const puedeDeshacer = ticket.estadoTriaje !== "Pendiente de confirmar";

  if (puedeAceptar) {
    const aceptar = document.createElement("button");
    aceptar.type = "button";
    aceptar.className = "boton boton--primario";
    aceptar.textContent = "Aceptar";
    aceptar.addEventListener("click", () => onAceptar?.());
    barra.append(aceptar);
  }

  const corregir = document.createElement("button");
  corregir.type = "button";
  corregir.className = "boton boton--secundario";
  corregir.textContent = "Corregir";
  corregir.addEventListener("click", () => onCorregir?.());
  barra.append(corregir);

  const deshacer = document.createElement("button");
  deshacer.type = "button";
  deshacer.className = "boton boton--fantasma";
  deshacer.textContent = "Deshacer";
  deshacer.disabled = !puedeDeshacer;
  deshacer.addEventListener("click", () => onDeshacer?.());
  barra.append(deshacer);

  const nota = document.createElement("p");
  nota.className = "ficha__acciones-nota";
  nota.textContent = ticket.categoria === SIN_CLASIFICAR && ticket.estadoTriaje === "Pendiente de confirmar"
    ? "Sin botón Aceptar: no hay sugerencia que aceptar. Solo se puede Corregir."
    : "Las acciones de la persona van fuera de la caja de la IA.";
  barra.append(nota);

  return barra;
}

export function crearFichaVer(ticket, zonasCriticas, callbacks) {
  const cont = document.createElement("div");
  cont.className = "ficha";
  cont.append(crearCabecera(ticket, callbacks));

  const cuerpo = document.createElement("div");
  cuerpo.className = "ficha__cuerpo";
  const columnaDerecha = document.createElement("div");
  columnaDerecha.className = "ficha__columna";
  columnaDerecha.append(crearCajaSugerencia(ticket), crearAcciones(ticket, callbacks));

  cuerpo.append(crearPanelDatos(ticket, zonasCriticas), columnaDerecha);
  cont.append(cuerpo);
  return cont;
}

function crearSelectCorregir({ etiqueta, valor, opciones, deshabilitado, notaBloqueo, onChange }) {
  const cont = document.createElement("div");
  const label = document.createElement("label");
  label.className = "dato__etiqueta";
  label.textContent = etiqueta;
  const select = document.createElement("select");
  select.className = "select-corregir";
  for (const op of opciones) {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    if (op === valor) option.selected = true;
    select.append(option);
  }
  select.disabled = deshabilitado;
  select.addEventListener("change", () => onChange(select.value));
  label.append(select);
  cont.append(label);
  if (notaBloqueo) {
    const nota = document.createElement("p");
    nota.className = "campo-corregir__nota";
    nota.textContent = notaBloqueo;
    cont.append(nota);
  }
  return cont;
}

// Modo "corregir": R5 (los tres campos editables) + R8 (la urgencia se fija o se
// recorta según la categoría, nunca se rechaza) + punto 13 de la 2ª revisión
// (se puede corregir a "Sin clasificar": urgencia e impacto quedan en null).
export function crearFichaCorregir(ticket, zonasCriticas, callbacks) {
  const cont = document.createElement("div");
  cont.className = "ficha";

  const chip = document.createElement("span");
  chip.className = "ficha__chip-modo";
  chip.textContent = "Modo corregir";
  cont.append(crearCabecera(ticket, { ...callbacks, extra: chip }));

  // Sobre un "Sin clasificar" se parte de la primera categoría real; pintarCampos()
  // rellena la urgencia y el impacto que le correspondan.
  let categoria = ticket.categoria === SIN_CLASIFICAR ? CATEGORIAS[0] : ticket.categoria;
  let urgencia = ticket.urgencia;
  let impacto = ticket.impacto;

  const cuerpo = document.createElement("div");
  cuerpo.className = "ficha__cuerpo";

  const columnaDerecha = document.createElement("div");
  columnaDerecha.className = "ficha__columna";

  const caja = document.createElement("div");
  caja.className = "caja-corregir";
  const cabeceraCaja = document.createElement("div");
  cabeceraCaja.className = "caja-ia__cabecera";
  cabeceraCaja.textContent = "CORRIGE LA CLASIFICACIÓN";
  caja.append(cabeceraCaja);

  const resumenPrioridad = document.createElement("div");
  resumenPrioridad.className = "caja-corregir__prioridad";

  function pintarPrioridad() {
    const prioridad = calcularPrioridad(urgencia, impacto);
    resumenPrioridad.textContent = `Prioridad recalculada: ${prioridad ?? "— (sin urgencia/impacto)"}`;
  }

  const camposCont = document.createElement("div");
  camposCont.className = "caja-corregir__campos";

  const guardar = document.createElement("button");
  guardar.type = "button";
  guardar.className = "boton boton--primario";
  guardar.textContent = "Guardar corrección";
  const notaGuardar = document.createElement("p");
  notaGuardar.className = "ficha__acciones-nota";

  // "Sin clasificar" + Confirmado es la única combinación imposible (R4). Si la IA ya
  // dijo "Sin clasificar" y el operador lo deja igual, no hay nada que guardar.
  function pintarGuardar() {
    const sigueSinClasificar = categoria === SIN_CLASIFICAR && ticket.sugerenciaEfectiva.categoria === SIN_CLASIFICAR;
    guardar.disabled = sigueSinClasificar;
    notaGuardar.textContent = sigueSinClasificar
      ? "Sigue sin clasificar: elige una categoría para poder guardar."
      : "Cuenta como Confirmado si coincide con la sugerencia de la IA; si no, como Corregido.";
  }

  function pintarCampos() {
    camposCont.replaceChildren();

    const esSinClasificar = categoria === SIN_CLASIFICAR;
    const permitidas = esSinClasificar ? null : urgenciasPermitidas(categoria);
    const opcionesUrgencia = permitidas ?? URGENCIAS;
    if (!esSinClasificar && !opcionesUrgencia.includes(urgencia)) urgencia = opcionesUrgencia[0];
    // Al volver de "Sin clasificar" a una categoría real, el impacto también hay
    // que reponerlo: si no, el desplegable enseña "Alto" (primera opción del
    // <select>) mientras la variable sigue en null y se guardaría incoherente.
    if (!esSinClasificar && !IMPACTOS.includes(impacto)) {
      impacto = zonasCriticas.includes(ticket.zona) ? "Alto" : "Medio";
    }
    if (esSinClasificar) { urgencia = null; impacto = null; }

    const notaUrgencia = esSinClasificar
      ? null
      : permitidas && permitidas.length === 1
      ? `«${categoria}» es siempre urgencia ${permitidas[0]}. Para cambiarla, cambia la categoría.`
      : permitidas
      ? `«${categoria}» no puede ser Alta.`
      : null;

    camposCont.append(
      crearSelectCorregir({
        etiqueta: "Categoría",
        valor: categoria,
        opciones: [...CATEGORIAS, SIN_CLASIFICAR],
        deshabilitado: false,
        onChange: (v) => { categoria = v; pintarCampos(); pintarPrioridad(); pintarGuardar(); },
      }),
      crearSelectCorregir({
        etiqueta: "Urgencia",
        valor: urgencia ?? "—",
        opciones: esSinClasificar ? ["—"] : opcionesUrgencia,
        deshabilitado: esSinClasificar || opcionesUrgencia.length === 1,
        notaBloqueo: esSinClasificar ? "Sin categoría, no hay urgencia que fijar." : notaUrgencia,
        onChange: (v) => { urgencia = v; pintarPrioridad(); },
      }),
      crearSelectCorregir({
        etiqueta: "Impacto",
        valor: impacto ?? "—",
        opciones: esSinClasificar ? ["—"] : IMPACTOS,
        deshabilitado: esSinClasificar,
        onChange: (v) => { impacto = v; pintarPrioridad(); },
      })
    );
  }

  pintarCampos();
  pintarPrioridad();
  pintarGuardar();
  caja.append(camposCont, resumenPrioridad);

  const acciones = document.createElement("div");
  acciones.className = "ficha__acciones";
  guardar.addEventListener("click", () => callbacks.onGuardar?.({ categoria, urgencia, impacto }));
  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.className = "boton boton--fantasma";
  cancelar.textContent = "Cancelar";
  cancelar.addEventListener("click", () => callbacks.onCancelar?.());
  acciones.append(guardar, cancelar, notaGuardar);

  columnaDerecha.append(caja, acciones);
  cuerpo.append(crearPanelDatos(ticket, zonasCriticas), columnaDerecha);
  cont.append(cuerpo);
  return cont;
}
