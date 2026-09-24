// Orquesta la Fase 3: carga data/tickets.json (una vez), gestiona el estado del
// triaje en localStorage y monta la pantalla. Único archivo que hace fetch.

import { CLAVE_TRIAJE, CLAVE_TEMA, ZONAS_CRITICAS, ESTADOS_TRIAJE, SIGUIENTE_ID_NUEVO_INICIAL } from "./utils/constantes.js";
import { derivarTicket, snapshotDeSugerencia, estadoAlGuardar } from "./utils/estado-ticket.js";
import { ordenarBandeja, filtrarTickets, valoresUnicos, calcularMetricas } from "./utils/filtros.js";
import { crearFilaTicket } from "./components/fila-ticket.js";
import { crearBarraFiltros } from "./components/barra-filtros.js";
import { crearFichaVer, crearFichaCorregir } from "./components/ficha-ticket.js";
import { crearPanelMetricas } from "./components/panel-metricas.js";
import { crearFormularioNuevoTicket } from "./components/nuevo-ticket.js";
import { formatearFechaHora, fechaLocal } from "./utils/formato.js";
import { unirNotas } from "./utils/texto-operador.js";
import { clasificarTicketNuevo } from "./utils/clasificador-nuevo-ticket.js";

const raiz = document.getElementById("app");

const estado = {
  tickets: [],
  triaje: {},
  tema: "claro",
  localStorageDisponible: true,
  filtrosBandeja: { estadoTriaje: "pendientes", prioridad: null, sistema: null, zona: null, estado: null },
  enfocarSeleccion: false,
  mostrarFormularioNuevo: false,
};

function probarLocalStorage() {
  try {
    const clave = "__svd_probe__";
    localStorage.setItem(clave, "1");
    localStorage.removeItem(clave);
    return true;
  } catch {
    return false;
  }
}

// R6: si localStorage no está (incógnito estricto, cuota llena), la app sigue en memoria.
function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    estado.localStorageDisponible = false;
  }
}

function cargarTriaje() {
  try {
    return JSON.parse(leer(CLAVE_TRIAJE)) ?? {};
  } catch {
    return {}; // JSON corrupto: se empieza de cero antes que romper la bandeja
  }
}

const guardarTriaje = () => escribir(CLAVE_TRIAJE, JSON.stringify(estado.triaje));
const cargarTema = () => (leer(CLAVE_TEMA) === "oscuro" ? "oscuro" : "claro");
const guardarTema = () => escribir(CLAVE_TEMA, estado.tema);

function aplicarTema() {
  document.documentElement.setAttribute("data-tema", estado.tema);
}

// R6: "hay cambios sin exportar" si hubo una modificación (confirmar, corregir o
// deshacer) después del último export. Se guarda aparte de las entradas por ticket
// porque Deshacer borra su entrada: comparar solo "fecha" se perdía ese caso
// (casos límite, "el operador deshace después de exportar").
function marcarModificacion() {
  estado.triaje._meta = { ...estado.triaje._meta, ultimaModificacion: new Date().toISOString() };
}

function hayCambiosSinExportar() {
  const meta = estado.triaje._meta ?? {};
  return Boolean(meta.ultimaModificacion) && (!meta.ultimoExport || meta.ultimaModificacion > meta.ultimoExport);
}

function ticketsDerivados() {
  return estado.tickets.map((t) => derivarTicket(t, estado.triaje[t.id] ?? null));
}

function buscarDerivado(id) {
  const original = estado.tickets.find((t) => t.id === id);
  return original ? derivarTicket(original, estado.triaje[id] ?? null) : null;
}

function guardarConfirmacion(id, { estadoTriaje, categoria, urgencia, impacto, motivoCorreccion = null }) {
  const ticket = buscarDerivado(id);
  estado.triaje[id] = {
    estado: estadoTriaje,
    categoria,
    urgencia,
    impacto,
    // R9: el motivo solo tiene sentido en un Corregido.
    motivoCorreccion: estadoTriaje === ESTADOS_TRIAJE.CORREGIDO ? motivoCorreccion : null,
    sugerenciaSnapshot: snapshotDeSugerencia(ticket.sugerenciaEfectiva),
    fecha: new Date().toISOString(),
  };
  marcarModificacion();
  guardarTriaje();
}

// R9: las notas van en `_notas`, aparte de la entrada del ticket, para que Deshacer
// (que borra esa entrada) no se las lleve.
const notasDe = (id) => estado.triaje._notas?.[id] ?? [];

function anadirNota(id, texto) {
  estado.triaje._notas = { ...estado.triaje._notas, [id]: [...notasDe(id), { texto, fecha: new Date().toISOString() }] };
  marcarModificacion();
  guardarTriaje();
}

// R10: el ticket nuevo se guarda en svd-triaje._nuevos (misma clave que las notas, R6 sigue con
// dos claves) y se mezcla en estado.tickets para pasar por el mismo derivarTicket que cualquier
// otro ticket: nace "Pendiente de confirmar", nunca clasificado de entrada (principio 1).
function crearTicketNuevo({ titulo, descripcion, sistema_afectado, reportado_por, zona }) {
  const siguiente = estado.triaje._meta?.siguienteIdNuevo ?? SIGUIENTE_ID_NUEVO_INICIAL;
  const id = `SVD-${siguiente}`;
  const ticket = {
    id, titulo, descripcion, sistema_afectado, reportado_por, zona,
    fecha: fechaLocal(new Date()),
    estado: "abierto",
    sugerencia: clasificarTicketNuevo({ titulo, descripcion, zona }),
  };
  estado.triaje._nuevos = [...(estado.triaje._nuevos ?? []), ticket];
  estado.triaje._meta = { ...estado.triaje._meta, siguienteIdNuevo: siguiente + 1 };
  estado.tickets = [...estado.tickets, ticket];
  marcarModificacion();
  guardarTriaje();
  return id;
}

function deshacerConfirmacion(id) {
  delete estado.triaje[id];
  marcarModificacion();
  guardarTriaje();
}

const listaVisible = () => ordenarBandeja(filtrarTickets(ticketsDerivados(), estado.filtrosBandeja));

// Tras decidir un ticket, el siguiente pendiente en el orden de la bandeja: el que venía
// detrás de él y sigue en la lista; si no hay, el primero que quede; si no, ninguno.
function siguientePendiente(idsAntes, id) {
  const pendientes = listaVisible().filter((t) => t.esSugerido).map((t) => t.id);
  const detras = idsAntes.slice(idsAntes.indexOf(id) + 1).find((x) => pendientes.includes(x));
  return detras ?? pendientes.find((x) => x !== id) ?? null;
}

function irAlSiguiente(idsAntes, id) {
  const siguiente = siguientePendiente(idsAntes, id);
  estado.enfocarSeleccion = true;
  navegar(siguiente ? `#/ticket/${siguiente}` : "#/bandeja");
}

function exportar() {
  const hoy = fechaLocal(new Date());
  const datos = estado.tickets.map((t) => {
    const derivado = derivarTicket(t, estado.triaje[t.id] ?? null);
    const triaje = derivado.triaje
      ? {
          estado: derivado.triaje.estado,
          categoria: derivado.triaje.categoria,
          urgencia: derivado.triaje.urgencia,
          impacto: derivado.triaje.impacto,
          motivoCorreccion: derivado.triaje.motivoCorreccion ?? null,
          fecha: derivado.triaje.fecha,
        }
      : null;
    return { ...t, triaje, notas: notasDe(t.id) };
  });

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `tickets-triaje-${hoy}.json`;
  // En el documento y revocado después: Firefox cancela la descarga si el enlace
  // está suelto o si la URL se revoca en el mismo tick del clic.
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);

  estado.triaje._meta = { ...estado.triaje._meta, ultimoExport: new Date().toISOString() };
  guardarTriaje();
  render();
}

// --- Rutas ---------------------------------------------------------------

function rutaActual() {
  const hash = location.hash.replace(/^#\/?/, "");
  const partes = hash.split("/").filter(Boolean);
  if (partes[0] === "ticket" && partes[1]) {
    return { vista: "ficha", id: partes[1], modo: partes[2] === "corregir" ? "corregir" : "ver" };
  }
  if (partes[0] === "metricas") return { vista: "metricas" };
  return { vista: "bandeja" };
}

function navegar(hash) {
  location.hash = hash;
}

// --- Piezas de la pantalla -------------------------------------------------

function crearRail(vista) {
  const aside = document.createElement("aside");
  aside.className = "rail";

  const marca = document.createElement("div");
  marca.className = "rail__marca";
  const icono = document.createElement("div");
  icono.className = "rail__icono";
  icono.textContent = "MSD";
  const nombre = document.createElement("div");
  nombre.className = "rail__nombre";
  nombre.textContent = "Mini Service Desk";
  marca.append(icono, nombre);

  const nav = document.createElement("nav");
  const etiqueta = document.createElement("div");
  etiqueta.className = "rail__nav-etiqueta";
  etiqueta.textContent = "Triaje";
  nav.append(etiqueta);

  for (const [ruta, texto] of [["#/bandeja", "Bandeja"], ["#/metricas", "Métricas"]]) {
    // Bandeja sigue activa con un ticket abierto: la ficha vive dentro de la bandeja.
    const enlace = document.createElement("a");
    enlace.href = ruta;
    enlace.className = "rail__enlace";
    enlace.textContent = texto;
    const activo = (ruta === "#/bandeja" && vista !== "metricas") || (ruta === "#/metricas" && vista === "metricas");
    if (activo) enlace.setAttribute("aria-current", "page");
    nav.append(enlace);
  }
  aside.append(marca, nav);

  const tema = document.createElement("button");
  tema.type = "button";
  tema.className = "rail__tema";
  tema.textContent = estado.tema === "claro" ? "Tema: claro" : "Tema: oscuro";
  tema.addEventListener("click", () => {
    estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
    guardarTema();
    aplicarTema();
    render();
  });
  aside.append(tema);

  if (!estado.localStorageDisponible) {
    const aviso = document.createElement("p");
    aviso.className = "rail__aviso";
    aviso.textContent = "Sin almacenamiento local: exporta antes de cerrar, no se guardará nada.";
    aside.append(aviso);
  }

  return aside;
}

function crearVistaBandeja(ruta) {
  const main = document.createElement("main");
  main.className = ruta.id ? "main main--bandeja main--con-ficha" : "main main--bandeja";

  const filtrados = listaVisible();

  const cabecera = document.createElement("div");
  cabecera.className = "cabecera";
  const filaSuperior = document.createElement("div");
  filaSuperior.className = "cabecera__fila";
  const titulo = document.createElement("h1");
  titulo.className = "cabecera__titulo";
  titulo.textContent = "Bandeja de triaje";
  const conteo = document.createElement("span");
  conteo.className = "cabecera__conteo";
  conteo.textContent = `${estado.tickets.length} incidencias · SVD-4100 a SVD-4159`;
  filaSuperior.append(titulo, conteo);

  if (hayCambiosSinExportar()) {
    const aviso = document.createElement("span");
    aviso.className = "cabecera__aviso";
    aviso.textContent = "⚠ Hay cambios sin exportar";
    filaSuperior.append(aviso);
  } else if (estado.triaje._meta?.ultimoExport) {
    const nota = document.createElement("span");
    nota.className = "cabecera__nota";
    nota.textContent = `Sin cambios pendientes · exportado ${formatearFechaHora(estado.triaje._meta.ultimoExport)}`;
    filaSuperior.append(nota);
  }

  const botonNuevo = document.createElement("button");
  botonNuevo.type = "button";
  botonNuevo.className = "boton boton--secundario";
  botonNuevo.textContent = "Nuevo ticket";
  botonNuevo.addEventListener("click", () => {
    estado.mostrarFormularioNuevo = true;
    render();
  });

  const botonExportar = document.createElement("button");
  botonExportar.type = "button";
  botonExportar.className = "boton boton--primario cabecera__exportar";
  botonExportar.textContent = "Exportar JSON";
  botonExportar.addEventListener("click", exportar);
  filaSuperior.append(botonNuevo, botonExportar);
  cabecera.append(filaSuperior);

  cabecera.append(
    crearBarraFiltros({
      sistemas: valoresUnicos(estado.tickets, "sistema_afectado"),
      zonas: valoresUnicos(estado.tickets, "zona"),
      filtros: estado.filtrosBandeja,
      onChange: (campo, valor) => {
        estado.filtrosBandeja[campo] = valor;
        render();
      },
    })
  );
  main.append(cabecera);

  const cuerpo = document.createElement("div");
  cuerpo.className = "bandeja__cuerpo";

  const lista = document.createElement("div");
  lista.className = "lista-tickets";
  if (filtrados.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "lista-tickets__vacio";
    vacio.textContent = "Ningún ticket coincide con estos filtros.";
    lista.append(vacio);
  } else {
    // Roving tabindex: Tab entra en la lista por una sola fila (la seleccionada o la primera)
    // y las flechas recorren el resto. Así Tab no pasa por las 60 filas para llegar a la ficha.
    const tabulable = filtrados.some((t) => t.id === ruta.id) ? ruta.id : filtrados[0].id;
    for (const ticket of filtrados) {
      lista.append(
        crearFilaTicket(ticket, {
          seleccionado: ticket.id === ruta.id,
          tabulable: ticket.id === tabulable,
          onAbrir: (id) => navegar(`#/ticket/${id}`),
        })
      );
    }
    lista.addEventListener("keydown", (evento) => {
      if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
      evento.preventDefault();
      const filas = [...lista.querySelectorAll(".fila-ticket")];
      const i = filas.indexOf(document.activeElement);
      const destino = filas[Math.max(0, Math.min(filas.length - 1, i + (evento.key === "ArrowDown" ? 1 : -1)))];
      estado.enfocarSeleccion = true;
      navegar(`#/ticket/${destino.dataset.id}`);
    });
  }
  cuerpo.append(lista);

  const ficha = document.createElement("section");
  ficha.className = "bandeja__ficha";
  ficha.setAttribute("aria-label", "Ficha del ticket");
  if (ruta.id) {
    ficha.append(crearVistaFicha(ruta.id, ruta.modo));
  } else {
    const vacio = document.createElement("p");
    vacio.className = "bandeja__ficha-vacia";
    vacio.textContent = "Elige un ticket de la lista para ver su sugerencia y decidir.";
    ficha.append(vacio);
  }
  cuerpo.append(ficha);
  main.append(cuerpo);

  if (estado.mostrarFormularioNuevo) {
    main.append(
      crearFormularioNuevoTicket({
        onCrear: (datos) => {
          const id = crearTicketNuevo(datos);
          estado.mostrarFormularioNuevo = false;
          // Un filtro de sistema, zona, prioridad o estado del ticket puesto antes de crear
          // podía dejar el ticket nuevo fuera de la lista sin que nada lo explicara en pantalla
          // (bug encontrado a mano, 24/09/2026): se limpian todos, no solo el de estado del triaje.
          estado.filtrosBandeja = { estadoTriaje: "pendientes", prioridad: null, sistema: null, zona: null, estado: null };
          navegar(`#/ticket/${id}`);
        },
        onCancelar: () => {
          estado.mostrarFormularioNuevo = false;
          render();
        },
      })
    );
  }

  return main;
}

function crearVistaFicha(id, modo) {
  const ticket = buscarDerivado(id);

  if (!ticket) {
    const aviso = document.createElement("p");
    aviso.className = "bandeja__ficha-vacia";
    aviso.textContent = `No existe ningún ticket con id ${id}.`;
    return aviso;
  }
  const idsAntes = listaVisible().map((t) => t.id);

  const callbacks = {
    onVolver: () => navegar("#/bandeja"),
    onAceptar: () => {
      guardarConfirmacion(id, { estadoTriaje: ESTADOS_TRIAJE.CONFIRMADO, categoria: ticket.categoria, urgencia: ticket.urgencia, impacto: ticket.impacto });
      irAlSiguiente(idsAntes, id);
    },
    onCorregir: () => navegar(`#/ticket/${id}/corregir`),
    // Deshacer se queda en el mismo ticket: vuelve a estar pendiente y se ve al momento.
    onDeshacer: () => {
      deshacerConfirmacion(id);
      render();
    },
    onGuardar: (valores) => {
      guardarConfirmacion(id, { estadoTriaje: estadoAlGuardar(ticket.sugerenciaEfectiva, valores), ...valores });
      irAlSiguiente(idsAntes, id);
    },
    onAnadirNota: (texto) => {
      anadirNota(id, texto);
      render();
    },
    onCancelar: () => navegar(`#/ticket/${id}`),
  };

  return modo === "corregir"
    ? crearFichaCorregir(ticket, ZONAS_CRITICAS, callbacks)
    : crearFichaVer({ ...ticket, notas: notasDe(id) }, ZONAS_CRITICAS, callbacks);
}

function crearVistaMetricas() {
  const main = document.createElement("main");
  main.className = "main";
  const derivados = ticketsDerivados();
  main.append(crearPanelMetricas(calcularMetricas(derivados), derivados.length));
  return main;
}

// R6 (punto 11 de la 2ª revisión QA): si data/tickets.json trae un `triaje` (el export
// volvió al repo), es el estado de partida y manda sobre localStorage. Pero solo la
// primera vez que se ve esa versión: `_meta.sembrados` recuerda la huella de cada
// triaje ya aplicado, para que lo que el operador haga después (corregir, deshacer)
// sobreviva a recargar en vez de volver a pisarse con el JSON.
function sembrarTriajeDesdeJSON() {
  const sembrados = { ...estado.triaje._meta?.sembrados };
  let cambios = false;
  for (const t of estado.tickets) {
    // R9 (decisión 31): las notas del JSON se unen con las del navegador, sin choque.
    if (t.notas?.length) {
      const unidas = unirNotas(notasDe(t.id), t.notas);
      if (unidas.length !== notasDe(t.id).length) {
        estado.triaje._notas = { ...estado.triaje._notas, [t.id]: unidas };
        cambios = true;
      }
    }
    if (!t.triaje) continue;
    const huella = JSON.stringify(t.triaje);
    if (sembrados[t.id] === huella) continue;
    estado.triaje[t.id] = t.triaje;
    sembrados[t.id] = huella;
    cambios = true;
  }
  if (!cambios) return;
  estado.triaje._meta = { ...estado.triaje._meta, sembrados };
  guardarTriaje();
}

// Casos límite: "las confirmaciones de ids que ya no existen se descartan".
function descartarHuerfanos() {
  const ids = new Set(estado.tickets.map((t) => t.id));
  const huerfanos = Object.keys(estado.triaje).filter((id) => !id.startsWith("_") && !ids.has(id));
  const notasHuerfanas = Object.keys(estado.triaje._notas ?? {}).filter((id) => !ids.has(id));
  if (huerfanos.length === 0 && notasHuerfanas.length === 0) return;
  for (const id of huerfanos) delete estado.triaje[id];
  for (const id of notasHuerfanas) delete estado.triaje._notas[id];
  guardarTriaje();
}

// Se repinta todo en cada cambio, pero la lista conserva su posición: si no, aceptar un
// ticket devolvería la lista arriba del todo (diseno.md, rediseño 24/09/2026).
function render() {
  const ruta = rutaActual();
  const scrollLista = raiz.querySelector(".lista-tickets")?.scrollTop ?? 0;
  raiz.replaceChildren();
  raiz.append(crearRail(ruta.vista));

  if (ruta.vista === "metricas") raiz.append(crearVistaMetricas());
  else raiz.append(crearVistaBandeja(ruta));

  const lista = raiz.querySelector(".lista-tickets");
  if (!lista) return;
  lista.scrollTop = scrollLista;
  const seleccionada = lista.querySelector('.fila-ticket[aria-current="true"]');
  seleccionada?.scrollIntoView({ block: "nearest" }); // solo se mueve si no se ve
  if (estado.enfocarSeleccion) seleccionada?.focus({ preventScroll: true });
  estado.enfocarSeleccion = false;
}

async function iniciar() {
  estado.localStorageDisponible = probarLocalStorage();
  estado.triaje = cargarTriaje();
  estado.tema = cargarTema();
  aplicarTema();

  try {
    const respuesta = await fetch("data/tickets.json", { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    estado.tickets = await respuesta.json();
  } catch (error) {
    raiz.textContent = "No se ha podido cargar data/tickets.json.";
    return;
  }

  sembrarTriajeDesdeJSON();
  descartarHuerfanos();
  // R10: los tickets creados a mano se cargan junto a los 60, con el mismo pipeline.
  estado.tickets = [...estado.tickets, ...(estado.triaje._nuevos ?? [])];

  window.addEventListener("hashchange", render);
  window.addEventListener("beforeunload", (evento) => {
    if (hayCambiosSinExportar()) {
      evento.preventDefault();
      evento.returnValue = "";
    }
  });

  render();
}

iniciar();
