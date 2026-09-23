// Orquesta la Fase 3: carga data/tickets.json (una vez), gestiona el estado del
// triaje en localStorage y monta la pantalla. Único archivo que hace fetch.

import { CLAVE_TRIAJE, CLAVE_TEMA, ZONAS_CRITICAS, ESTADOS_TRIAJE } from "./utils/constantes.js";
import { derivarTicket, snapshotDeSugerencia, estadoAlGuardar } from "./utils/estado-ticket.js";
import { ordenarBandeja, filtrarTickets, valoresUnicos, calcularMetricas } from "./utils/filtros.js";
import { crearFilaTicket } from "./components/fila-ticket.js";
import { crearBarraFiltros } from "./components/barra-filtros.js";
import { crearFichaVer, crearFichaCorregir } from "./components/ficha-ticket.js";
import { crearPanelMetricas } from "./components/panel-metricas.js";
import { formatearFechaHora } from "./utils/formato.js";

const raiz = document.getElementById("app");

const estado = {
  tickets: [],
  triaje: {},
  tema: "claro",
  localStorageDisponible: true,
  filtrosBandeja: { estadoTriaje: "pendientes", prioridad: null, sistema: null, zona: null, estado: null },
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

function cargarTriaje() {
  if (!estado.localStorageDisponible) return {};
  try {
    const bruto = localStorage.getItem(CLAVE_TRIAJE);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

function guardarTriaje() {
  if (!estado.localStorageDisponible) return;
  try {
    localStorage.setItem(CLAVE_TRIAJE, JSON.stringify(estado.triaje));
  } catch {
    estado.localStorageDisponible = false;
  }
}

function cargarTema() {
  if (!estado.localStorageDisponible) return "claro";
  try {
    return localStorage.getItem(CLAVE_TEMA) === "oscuro" ? "oscuro" : "claro";
  } catch {
    return "claro";
  }
}

function guardarTema() {
  if (!estado.localStorageDisponible) return;
  try {
    localStorage.setItem(CLAVE_TEMA, estado.tema);
  } catch {
    estado.localStorageDisponible = false;
  }
}

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

function guardarConfirmacion(id, { estadoTriaje, categoria, urgencia, impacto }) {
  const ticket = buscarDerivado(id);
  estado.triaje[id] = {
    estado: estadoTriaje,
    categoria,
    urgencia,
    impacto,
    sugerenciaSnapshot: snapshotDeSugerencia(ticket.sugerenciaEfectiva),
    fecha: new Date().toISOString(),
  };
  marcarModificacion();
  guardarTriaje();
}

function deshacerConfirmacion(id) {
  delete estado.triaje[id];
  marcarModificacion();
  guardarTriaje();
}

function exportar() {
  const hoy = new Date().toISOString().slice(0, 10);
  const datos = estado.tickets.map((t) => {
    const derivado = derivarTicket(t, estado.triaje[t.id] ?? null);
    const triaje = derivado.triaje
      ? { estado: derivado.triaje.estado, categoria: derivado.triaje.categoria, urgencia: derivado.triaje.urgencia, impacto: derivado.triaje.impacto, fecha: derivado.triaje.fecha }
      : null;
    return { ...t, triaje };
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
  nav.className = "rail__nav";
  const etiqueta = document.createElement("div");
  etiqueta.className = "rail__nav-etiqueta";
  etiqueta.textContent = "TRIAJE";
  nav.append(etiqueta);

  for (const [ruta, texto] of [["#/bandeja", "Bandeja"], ["#/metricas", "Métricas"]]) {
    const enlace = document.createElement("a");
    enlace.href = ruta;
    enlace.className = "rail__enlace";
    enlace.textContent = texto;
    const activo = (ruta === "#/bandeja" && vista === "bandeja") || (ruta === "#/metricas" && vista === "metricas");
    if (activo) enlace.setAttribute("aria-current", "page");
    nav.append(enlace);
  }
  aside.append(marca, nav);

  const tema = document.createElement("button");
  tema.type = "button";
  tema.className = "rail__tema";
  tema.textContent = estado.tema === "claro" ? "Tema: Claro" : "Tema: Oscuro";
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

function crearVistaBandeja() {
  const main = document.createElement("main");
  main.className = "main";

  const derivados = ticketsDerivados();
  const filtrados = ordenarBandeja(filtrarTickets(derivados, estado.filtrosBandeja));

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

  const botonExportar = document.createElement("button");
  botonExportar.type = "button";
  botonExportar.className = "boton boton--primario cabecera__exportar";
  botonExportar.textContent = "Exportar ↓";
  botonExportar.addEventListener("click", exportar);
  filaSuperior.append(botonExportar);
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

  const lista = document.createElement("div");
  lista.className = "lista-tickets";
  if (filtrados.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "lista-tickets__vacio";
    vacio.textContent = "Ningún ticket coincide con estos filtros.";
    lista.append(vacio);
  } else {
    for (const ticket of filtrados) {
      lista.append(crearFilaTicket(ticket, { onAbrir: (id) => navegar(`#/ticket/${id}`) }));
    }
  }
  main.append(lista);

  return main;
}

function crearVistaFicha(id, modo) {
  const main = document.createElement("main");
  main.className = "main main--ficha";
  const ticket = buscarDerivado(id);

  if (!ticket) {
    const aviso = document.createElement("p");
    aviso.textContent = `No existe ningún ticket con id ${id}.`;
    main.append(aviso);
    return main;
  }

  const callbacks = {
    onVolver: () => navegar("#/bandeja"),
    onAceptar: () => {
      guardarConfirmacion(id, { estadoTriaje: ESTADOS_TRIAJE.CONFIRMADO, categoria: ticket.categoria, urgencia: ticket.urgencia, impacto: ticket.impacto });
      navegar("#/bandeja");
    },
    onCorregir: () => navegar(`#/ticket/${id}/corregir`),
    onDeshacer: () => {
      deshacerConfirmacion(id);
      navegar("#/bandeja");
    },
    onGuardar: (valores) => {
      guardarConfirmacion(id, { estadoTriaje: estadoAlGuardar(ticket.sugerenciaEfectiva, valores), ...valores });
      navegar("#/bandeja");
    },
    onCancelar: () => navegar(`#/ticket/${id}`),
  };

  main.append(modo === "corregir" ? crearFichaCorregir(ticket, ZONAS_CRITICAS, callbacks) : crearFichaVer(ticket, ZONAS_CRITICAS, callbacks));
  return main;
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
  const huerfanos = Object.keys(estado.triaje).filter((id) => id !== "_meta" && !ids.has(id));
  if (huerfanos.length === 0) return;
  for (const id of huerfanos) delete estado.triaje[id];
  guardarTriaje();
}

function render() {
  const ruta = rutaActual();
  raiz.replaceChildren();
  raiz.append(crearRail(ruta.vista));

  if (ruta.vista === "ficha") raiz.append(crearVistaFicha(ruta.id, ruta.modo));
  else if (ruta.vista === "metricas") raiz.append(crearVistaMetricas());
  else raiz.append(crearVistaBandeja());
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
