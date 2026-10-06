/**
 * CAPA DE PERSISTENCIA —> Repositorio de clientes.
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
}
