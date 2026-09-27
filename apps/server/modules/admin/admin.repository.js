/**
 * CAPA DE PERSISTENCIA — Repositorio de administración.
 *
 * Escribe solo en el esquema `admin` (§ 9.3): usuario,
 * recuperacion_contrasena, bitacora y parametro_negocio.
 *
 * POR IMPLEMENTAR
 *   buscarUsuarioPorCorreo()   RF-50, RF-53 — el correo se compara con lower()
 *   crearUsuario()             RF-49 — una sola cuenta de administrador (índice único)
 *   actualizarParametro()      RF-51, aprobado #10
 *   registrarRecuperacion()    RF-54 — se guarda el hash del token, nunca el token
 *
 * RNF-08: la contraseña llega ya transformada con hash; este repositorio
 * jamás recibe ni devuelve una contraseña en claro.
 */

export class AdminRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /**
   * Escribe una entrada de la bitácora de auditoría (RF-52, RNF-10).
   * La tabla es de solo inserción (DD-16).
   *
   * Está implementado porque el suscriptor del bus lo necesita desde el
   * primer sprint. RNF-09: ningún evento transporta datos de tarjeta.
   */
  async registrarEnBitacora({
    accion,
    usuarioId = null,
    entidad = null,
    entidadId = null,
    valorAnterior = null,
    valorNuevo = null,
  }) {
    await this.#pool.query(
      `INSERT INTO admin.bitacora
              (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        usuarioId,
        accion,
        entidad,
        entidadId === null ? null : String(entidadId),
        valorAnterior === null ? null : JSON.stringify(valorAnterior),
        valorNuevo === null ? null : JSON.stringify(valorNuevo),
      ]
    );
  }

  /** Valor en texto de un parámetro de negocio, o `null` si no existe. */
  async obtenerParametro(clave) {
    const { rows } = await this.#pool.query(
      `SELECT valor FROM admin.parametro_negocio WHERE clave = $1`,
      [clave]
    );
    return rows[0]?.valor ?? null;
  }
}
