/**
 * Contrato de un paso del motor de precios (Strategy).
 *
 * Cada paso recibe un monto y devuelve otro. Son intercambiables y no se
 * conocen entre sí, así que el orden lo decide quien arma el pipeline.
 *
 * Esto importa porque INC-05 deja la fórmula exacta en disputa a la
 * espera del Excel del cliente: cuando se aclare, se reordena o se
 * reemplaza un paso sin reescribir el cálculo completo.
 */

export class PasoDePrecio {
  /** Nombre corto que aparece en el desglose. */
  get nombre() {
    throw new Error("Sin implementar: nombre");
  }

  /**
   * @param {number} monto monto acumulado hasta este paso, en colones
   * @param {Object} producto datos del producto (costo, importación, margen)
   * @returns {number} monto resultante
   */
  aplicar(monto, producto) {
    throw new Error("Sin implementar: aplicar()");
  }
}
