/**
 * Descuento por nivel de fidelidad (Strategy, § 6.5b).
 *
 * RN-08 fija la escala de niveles por recompra y RN-09 el porcentaje de
 * cada uno, aplicable solo sobre compras superiores al monto mínimo.
 *
 * El requerimiento aprobado #10 permite al administrador cambiar la
 * escala, los porcentajes y el monto mínimo sin pedir un cambio al
 * sistema. Por eso ningún valor está escrito aquí: la escala sale de
 * `clientes.nivel_fidelidad`, el monto de `admin.parametro_negocio`, y
 * ambos entran por constructor (DD-14).
 *
 * Aviso: RN-09, RN-10 y RN-11 están marcadas "en conflicto" en el SRS.
 */

export class EstrategiaDeDescuento {
  /**
   * @param {number} _montoBruto
   * @param {{numCompras: number}} _cliente
   * @returns {{porcentaje: number, monto: number, nivel: number}}
   */
  calcular(_montoBruto, _cliente) {
    throw new Error("Sin implementar: calcular()");
  }
}

export class DescuentoPorNivel extends EstrategiaDeDescuento {
  #escala;
  #montoMinimo;

  /**
   * @param {{
   *   escala: Array<{nivel: number, comprasMinimas: number, porcentajeDescuento: number}>,
   *   montoMinimo: number
   * }} parametros
   */
  constructor({ escala, montoMinimo }) {
    super();
    if (!escala?.length) {
      throw new Error("La escala de niveles está vacía: cargue las semillas de referencia.");
    }
    // De mayor a menor, para quedarse con el primer escalón que se alcance.
    this.#escala = [...escala].sort((a, b) => b.comprasMinimas - a.comprasMinimas);
    this.#montoMinimo = montoMinimo;
  }

  /**
   * RN-08 — el nivel depende de la recompra, no de la antigüedad. No se
   * guarda en la base de datos: se deriva de `num_compras` y la escala.
   */
  nivelDe(numCompras) {
    return (
      this.#escala.find((escalon) => numCompras >= escalon.comprasMinimas) ??
      this.#escala.at(-1)
    );
  }

  calcular(montoBruto, cliente) {
    const escalon = this.nivelDe(cliente?.numCompras ?? 0);

    // RN-09 — el descuento solo aplica sobre el monto mínimo.
    if (montoBruto <= this.#montoMinimo) {
      return { porcentaje: 0, monto: 0, nivel: escalon.nivel };
    }

    return {
      porcentaje: escalon.porcentajeDescuento,
      monto: Math.round((montoBruto * escalon.porcentajeDescuento) / 100),
      nivel: escalon.nivel,
    };
  }
}

/** Null Object: pedidos sin cliente asociado (ventas de otros canales). */
export class SinDescuento extends EstrategiaDeDescuento {
  calcular() {
    return { porcentaje: 0, monto: 0, nivel: 1 };
  }
}
