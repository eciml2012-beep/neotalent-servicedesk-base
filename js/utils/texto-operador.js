// R9: validación del texto libre del operador (notas y motivo de corrección) y unión de notas.
// Funciones puras: sin estado y sin tocar el DOM.

// Principio 3 (enmienda del 23/09/2026): lo que tiene forma de dato personal no se guarda.
// ponytail: solo formas españolas fijas; los nombres propios no se detectan (límite declarado en R9).
const DATOS_PERSONALES = [
  ["un NIE", /\b[XYZ][\s-]?\d{7}[\s-]?[A-Z]\b/i],
  ["un DNI", /\b\d{8}[\s-]?[A-Z]\b/i],
  ["una matrícula", /\b\d{4}[\s-]?[BCDFGHJKLMNPRSTVWXYZ]{3}\b/i],
];

/** Qué dato personal parece contener el texto ("un DNI"…), o null. */
export function pareceDatoPersonal(texto) {
  return DATOS_PERSONALES.find(([, patron]) => patron.test(texto))?.[0] ?? null;
}

/** { texto: recortado, error: motivo por el que no se puede guardar | null }. */
export function validarTextoOperador(texto, { min, max }) {
  const limpio = (texto ?? "").trim();
  const dato = pareceDatoPersonal(limpio);
  const error =
    limpio.length < min ? (min === 1 ? "Escribe algo para poder guardarlo." : `Escribe al menos ${min} caracteres.`)
    : limpio.length > max ? `Como máximo ${max} caracteres.`
    : dato ? `Parece ${dato}: no se guardan datos personales (principio 3).`
    : null;
  return { texto: limpio, error };
}

/** Une dos listas de notas sin duplicar (misma fecha y texto = misma nota), en orden cronológico. */
export function unirNotas(a = [], b = []) {
  const porClave = new Map([...a, ...b].map((n) => [`${n.fecha}|${n.texto}`, n]));
  return [...porClave.values()].sort((x, y) => x.fecha.localeCompare(y.fecha));
}
