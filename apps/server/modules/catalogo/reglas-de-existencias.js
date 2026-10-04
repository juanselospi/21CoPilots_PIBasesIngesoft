/**
 * Reglas de las existencias y el contrapedido de un producto.
 */

const MAXIMO_DE_EXISTENCIAS = 2_147_483_647; // INTEGER

export function problemaDeLasExistencias(existencias) {
  if (!Number.isInteger(existencias) || existencias < 0 || existencias > MAXIMO_DE_EXISTENCIAS) {
    return "Las existencias tienen que ser un número entero de 0 o más.";
  }
  return null;
}

export function problemaDelContrapedido(admiteContrapedido) {
  if (typeof admiteContrapedido !== "boolean") {
    return "Indique si el producto admite contrapedido.";
  }
  return null;
}
