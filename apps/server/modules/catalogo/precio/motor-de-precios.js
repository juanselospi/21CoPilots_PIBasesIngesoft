/**
 * Motor de precios.
 *
 * Aplica los pasos en orden sobre el costo del producto: importación,
 * margen e impuesto (ver documentos/diseño/formula-precio.md).
 *
 * Además del precio final devuelve el desglose de cada paso, para poder
 * comparar el cálculo del sistema con el del Excel y ver en qué paso se
 * separan si no coinciden.
 *
 * No toca la base de datos ni HTTP, así que se prueba sin levantar nada.
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

// Se calcula con el valor exacto y solo se redondea lo que se muestra, a
// 2 decimales, igual que el Excel del cliente. Si se redondeara en cada
// paso, el precio de algunos productos quedaría un centavo más alto.
//
// El EPSILON corrige casos como 1,005, que en JavaScript se guarda como
// 1,00499... y sin él quedaría en 1,00 en vez de 1,01.
const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
