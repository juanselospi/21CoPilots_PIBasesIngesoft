/**
 * CAPA DE PERSISTENCIA — Repositorio de clientes.
 *
 * PENDIENTE: adaptar al EER corregido antes de implementar (ver cambios-siguiente-sprint.md):
 *   - el esquema clientes solo tiene cliente (correo_usuario, cedula, direccion, num_compras)
 *     y cliente_telefono, no hay nivel_fidelidad ni consentimiento_terminos
 *   - el cliente se identifica por correo_usuario, asi que obtenerPorId pasa a obtenerPorCorreo
 *   - la cedula es obligatoria y unica, y un cliente no existe sin su usuario
 *   - RF-38 no tiene donde guardarse, sigue por definir
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
}
