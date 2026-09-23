// Panel de métricas, solo lectura (spec R7). Recibe el resultado de
// utils/filtros.js#calcularMetricas por parámetro.

function tarjetaKpi(titulo, valor, nota) {
  const div = document.createElement("div");
  div.className = "panel panel--kpi";
  const t = document.createElement("div");
  t.className = "panel__titulo";
  t.textContent = titulo;
  const v = document.createElement("div");
  v.className = "kpi__valor";
  v.textContent = valor;
  div.append(t, v);
  if (nota) {
    const n = document.createElement("div");
    n.className = "kpi__nota";
    n.textContent = nota;
    div.append(n);
  }
  return div;
}

function barra(etiqueta, valor, total) {
  const fila = document.createElement("div");
  fila.className = "barra-metrica";
  const label = document.createElement("div");
  label.className = "barra-metrica__etiqueta";
  label.textContent = etiqueta;
  const pista = document.createElement("div");
  pista.className = "barra-metrica__pista";
  const relleno = document.createElement("div");
  relleno.className = "barra-metrica__relleno";
  relleno.style.width = total > 0 ? `${Math.round((valor / total) * 100)}%` : "0%";
  pista.append(relleno);
  const numero = document.createElement("div");
  numero.className = "barra-metrica__numero";
  numero.textContent = String(valor);
  fila.append(label, pista, numero);
  return fila;
}

function formatearPorcentaje(tasa) {
  return tasa == null ? "—" : `${Math.round(tasa * 100)}%`;
}

export function crearPanelMetricas(metricas, totalTickets) {
  const cont = document.createElement("div");
  cont.className = "metricas";

  const cabecera = document.createElement("div");
  cabecera.className = "metricas__cabecera";
  const titulo = document.createElement("span");
  titulo.className = "metricas__titulo";
  titulo.textContent = "Métricas del triaje";
  const soloLectura = document.createElement("span");
  soloLectura.className = "metricas__solo-lectura";
  soloLectura.textContent = "Solo lectura";
  cabecera.append(titulo, soloLectura);
  cont.append(cabecera);

  const kpis = document.createElement("div");
  kpis.className = "metricas__kpis";
  kpis.append(
    tarjetaKpi("Pendientes de confirmar", String(metricas.pendientes), `de ${totalTickets} tickets`),
    tarjetaKpi("Tasa de corrección", formatearPorcentaje(metricas.tasaCorreccion), `${metricas.corregidos} corregidos / ${metricas.confirmados + metricas.corregidos} revisados`),
    tarjetaKpi("Revisados", String(metricas.confirmados + metricas.corregidos), `${metricas.confirmados} confirmados · ${metricas.corregidos} corregidos`)
  );
  cont.append(kpis);

  const filas = document.createElement("div");
  filas.className = "metricas__filas";

  const porPrioridad = document.createElement("div");
  porPrioridad.className = "panel panel--metrica";
  const tp = document.createElement("div");
  tp.className = "panel__titulo";
  tp.textContent = "TICKETS POR PRIORIDAD";
  porPrioridad.append(tp);
  for (const nivel of ["Crítica", "Alta", "Media", "Baja"]) {
    porPrioridad.append(barra(nivel, metricas.porPrioridad[nivel] ?? 0, totalTickets));
  }
  filas.append(porPrioridad);

  const porCategoria = document.createElement("div");
  porCategoria.className = "panel panel--metrica";
  const tc = document.createElement("div");
  tc.className = "panel__titulo";
  tc.textContent = "TICKETS POR CATEGORÍA · % CORREGIDO SOBRE LO QUE SUGIRIÓ LA IA";
  porCategoria.append(tc);
  // Unión de claves: una categoría puede tener revisiones (por lo que sugirió la IA)
  // aunque ya no le quede ningún ticket con esa categoría final.
  const categorias = new Set([...Object.keys(metricas.porCategoria), ...Object.keys(metricas.tasaPorCategoria)]);
  const filasCategoria = [...categorias].map((c) => [c, metricas.porCategoria[c] ?? 0]).sort((a, b) => b[1] - a[1]);
  for (const [categoria, cantidad] of filasCategoria) {
    const fila = barra(categoria, cantidad, totalTickets);
    const tasa = document.createElement("div");
    tasa.className = "barra-metrica__tasa";
    tasa.textContent = formatearPorcentaje(metricas.tasaPorCategoria[categoria]);
    fila.append(tasa);
    porCategoria.append(fila);
  }
  filas.append(porCategoria);

  cont.append(filas);
  return cont;
}
