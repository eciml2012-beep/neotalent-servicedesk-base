// Funciones puras: matriz de prioridad (R3) y validación de coherencia (R8).
// Sin estado, sin tocar el DOM.

import { CATEGORIAS, URGENCIA_OBLIGATORIA, ZONAS_CRITICAS, URGENCIAS, SIN_CLASIFICAR } from "./constantes.js";

const MATRIZ = {
  Alta: { Alto: "Crítica", Medio: "Alta", Bajo: "Media" },
  Media: { Alto: "Alta", Medio: "Media", Bajo: "Baja" },
  Baja: { Alto: "Media", Medio: "Baja", Bajo: "Baja" },
};

// R3: la prioridad nunca se guarda, siempre sale de aquí.
export function calcularPrioridad(urgencia, impacto) {
  return MATRIZ[urgencia]?.[impacto] ?? null;
}

// R8: urgencias que puede tener una categoría. null = libre (las tres valen).
export function urgenciasPermitidas(categoria) {
  return URGENCIA_OBLIGATORIA[categoria] ?? null;
}

// R8 (ampliado, punto 9 de la 2ª revisión QA): valida categoría×urgencia y, salvo
// las excepciones de R2 (una persona, brecha siempre por zona), impacto×zona.
// Devuelve true si la combinación es posible; false si hay que tratarla como Sin clasificar.
export function esSugerenciaCoherente(sugerencia, zona) {
  if (!sugerencia) return false;
  const { categoria, urgencia, impacto, motivo } = sugerencia;

  if (!motivo || motivo.trim().length === 0) return false;
  if (categoria === SIN_CLASIFICAR) return urgencia == null && impacto == null;
  if (!CATEGORIAS.includes(categoria)) return false;
  if (!URGENCIAS.includes(urgencia)) return false;

  const permitidas = urgenciasPermitidas(categoria);
  if (permitidas && !permitidas.includes(urgencia)) return false;

  // Alto solo es posible en zona crítica. Bajo siempre es posible (excepción "una
  // persona", R2) salvo que la categoría sea una brecha, que nunca es Bajo.
  if (impacto === "Alto" && !ZONAS_CRITICAS.includes(zona)) return false;
  if (categoria === "Brecha de seguridad activa" && impacto === "Bajo") return false;

  return true;
}
