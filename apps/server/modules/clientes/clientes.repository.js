/**
 * CAPA DE PERSISTENCIA — Repositorio de clientes.
 *
 * Escribe solo en el esquema `clientes` (§ 9.3): nivel_fidelidad,
 * cliente, cliente_telefono y consentimiento_terminos.
 *
 * POR IMPLEMENTAR
 *   registrar()                    RF-32, RF-33 — el cliente nace con su primera compra (RN-07)
 *   obtenerPorId() / porUsuario()  RF-37
 *   incrementarCompras()           RF-34 — `num_compras` es el insumo del nivel (RN-08)
 *   registrarConsentimiento()      RF-38 — solo inserción, con fecha
 *   actualizarDatosFiscales()      aprobado #3 — cédula para la factura (RN-18)
 */

export class ClientesRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Escala de niveles vigente (RN-08, RN-09), editable por el administrador. */
  async listarNivelesDeFidelidad() {
    const { rows } = await this.#pool.query(
      `SELECT nivel, compras_minimas, porcentaje_descuento
         FROM clientes.nivel_fidelidad
        ORDER BY compras_minimas`
    );

    return rows.map((fila) => ({
      nivel: fila.nivel,
      comprasMinimas: fila.compras_minimas,
      porcentajeDescuento: Number(fila.porcentaje_descuento),
    }));
  }
}
