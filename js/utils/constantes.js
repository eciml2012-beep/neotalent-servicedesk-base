// Valores fijos del dominio (spec R1-R8, docs/categorias-triaje.md).

export const CATEGORIAS = [
  "Brecha de seguridad activa",
  "Equipo de campo averiado",
  "Pérdida de registro o evidencia",
  "Fallo de integración entre sistemas",
  "Petición de acceso",
  "Falsa alarma recurrente",
  "Petición de información",
];

export const SIN_CLASIFICAR = "Sin clasificar";

export const URGENCIAS = ["Alta", "Media", "Baja"];
export const IMPACTOS = ["Alto", "Medio", "Bajo"];

export const ZONAS_CRITICAS = ["Perímetro exterior", "Sala de servidores", "Torre de control"];

// R8: urgencia que le corresponde a cada categoria. Un array de mas de un valor
// significa "libre pero no todas": FALSA_ALARMA no puede ser Alta.
export const URGENCIA_OBLIGATORIA = {
  "Brecha de seguridad activa": ["Alta"],
  "Petición de acceso": ["Baja"],
  "Petición de información": ["Baja"],
  "Falsa alarma recurrente": ["Media", "Baja"],
};

export const ESTADOS_TRIAJE = {
  PENDIENTE: "Pendiente de confirmar",
  CONFIRMADO: "Confirmado",
  CORREGIDO: "Corregido",
};

export const CLAVE_TRIAJE = "svd-triaje";
export const CLAVE_TEMA = "svd-tema";

// R9: límites del texto libre del operador, sin contar los espacios de los extremos.
export const LIMITES_NOTA = { min: 1, max: 500 };
export const LIMITES_MOTIVO_CORRECCION = { min: 10, max: 200 };
export const AVISO_DATOS_PERSONALES = "No escribas nombres, DNI, matrículas ni otros datos personales.";
