/**
 * Formato del teléfono y la dirección del cliente; los comparten el registro
 * y "Mi cuenta" para revisar y guardar igual.
 */

export const LIMITE_DE_LA_DIRECCION = 500;

// 8 dígitos de Costa Rica, con o sin guion o espacio en medio
const TELEFONO = /^(\d{4})[- ]?(\d{4})$/;

/** El teléfono como se guarda (8888-8888), o null si no tiene el formato. */
export function normalizarTelefono(telefono) {
  const partes = typeof telefono === "string" ? telefono.trim().match(TELEFONO) : null;
  return partes ? `${partes[1]}-${partes[2]}` : null;
}

export function problemaDelTelefono(telefono) {
  if (typeof telefono !== "string" || !telefono.trim()) return "El teléfono es obligatorio.";
  if (!normalizarTelefono(telefono)) return "El teléfono tiene que tener 8 dígitos, por ejemplo 8888-8888.";
  return null;
}

export function problemaDeLaDireccion(direccion) {
  if (!direccion) return "La dirección es obligatoria.";
  if (direccion.length > LIMITE_DE_LA_DIRECCION) {
    return `La dirección no puede pasar de ${LIMITE_DE_LA_DIRECCION} caracteres.`;
  }
  return null;
}
