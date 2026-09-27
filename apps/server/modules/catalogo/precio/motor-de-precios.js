/**
 * Motor de precios (Strategy compuesta, en forma de Pipes & Filters, § 5.4).
 *
 * Encadena pasos intercambiables sobre el costo del producto:
 *
 *   costo → importación → margen → impuesto → precio final
 *
 * Devuelve además el desglose paso por paso. Eso no es un lujo: RNF-17
 * se verifica comparando el cálculo del sistema contra el cálculo manual,
 * y con el desglose se ve en cuál paso se separan los números. También
 * sirve para cerrar INC-05 cuando llegue el Excel del cliente.
 *
 * El motor no toca la base de datos ni HTTP: es una función pura sobre
 * los datos del producto, y se prueba sin levantar nada (§ 3.2).
 */

export class MotorDePrecios {
  #pasos;

  /** @param {import('./paso-de-precio.js').PasoDePrecio[]} pasos */
  constructor(pasos) {
    if (!Array.isArray(pasos) || pasos.length === 0) {
      throw new Error("El motor de precios requiere al menos un paso.");
    }
    this.#pasos = pasos;
  }

  /**
   * @param {{costoItem: number, porcentajeImportacion?: number, margenGanancia?: number}} producto
   * @returns {{precioFinal: number, desglose: Array<{paso: string, monto: number}>}}
   */
  calcular(producto) {
    const costo = Number(producto.costoItem ?? 0);
    const desglose = [{ paso: "costo", monto: redondear(costo) }];

    const monto = this.#pasos.reduce((acumulado, paso) => {
      const resultado = paso.aplicar(acumulado, producto);
      desglose.push({ paso: paso.nombre, monto: redondear(resultado) });
      return resultado;
    }, costo);

    return { precioFinal: redondear(monto), desglose };
  }
}

/** Los montos se expresan en colones (RNF-17); se redondea al colón. */
const redondear = (monto) => Math.round(monto);
