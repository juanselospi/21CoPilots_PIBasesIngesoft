/**
 * CAPA DE PERSISTENCIA —> Repositorio de clientes.
 *
 * El cliente se identifica por `correo_usuario`, el mismo correo de su
 * cuenta en `usuarios.usuario`.
 *
 * POR IMPLEMENTAR
 *   registrar()                    RF-32, RF-33 — usuario, cliente y teléfono en una transacción
 *   obtenerPorCorreo()             RF-37
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
