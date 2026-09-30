/**
 * CAPA DE PERSISTENCIA — Repositorio de administración.
 *
 * Escribe solo en el esquema `admin` (§ 9.3): usuario, administrador y
 * sesion. El usuario se identifica por su correo (llave del EER) y el rol
 * sale de la especialización: es administrador si está en
 * admin.administrador y cliente si está en clientes.cliente.
 *
 * POR IMPLEMENTAR
 *   crearUsuario()             RF-49 — una sola cuenta de administrador (índice único)
 *   actualizarParametro()      RF-51, aprobado #10
 *   registrarRecuperacion()    RF-54 — se guarda el hash del token, nunca el token
 *
 * RNF-08: la contraseña llega ya transformada con hash; este repositorio
 * jamás recibe ni devuelve una contraseña en claro.
 */

// Rol del usuario `u` según la especialización disjunta del EER
const ROL_DEL_USUARIO = `
       CASE WHEN EXISTS (SELECT 1 FROM admin.administrador a WHERE a.correo_usuario = u.correo)
            THEN 'administrador'
            ELSE 'cliente'
       END AS rol`;

export class AdminRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /**
   * Bitácora de auditoría (RF-52, RNF-10). POR AHORA NO SE GUARDA: el EER
   * no tiene la entidad Bitácora. El suscriptor del bus sigue llamando a
   * este método, así que cuando la entidad exista solo cambia este cuerpo.
   * RNF-09: ningún evento transporta datos de tarjeta.
   */
  async registrarEnBitacora() {}

  /** Valor en texto de un parámetro de negocio, o `null` si no existe. */
  async obtenerParametro(clave) {
    const { rows } = await this.#pool.query(
      `SELECT valor FROM admin.parametro_negocio WHERE clave = $1`,
      [clave]
    );
    return rows[0]?.valor ?? null;
  }

  /**
   * RF-50, RF-53 — el correo se guarda normalizado (minúsculas, sin
   * espacios en los extremos), así que se normaliza igual para buscarlo.
   * Incluye el hash de la contraseña para el servicio.
   */
  async buscarUsuarioPorCorreo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, u.contrasena, ${ROL_DEL_USUARIO}
       FROM   admin.usuario u
       WHERE  u.correo = lower(btrim($1))`,
      [correo]
    );
    if (!rows[0]) return null;

    const { contrasena: contrasenaHash, ...usuario } = rows[0];
    return { ...usuario, contrasenaHash };
  }

  /** RF-53 — se guarda el hash del token, nunca el token. */
  async crearSesion({ correoUsuario, tokenHash, venceEn }) {
    await this.#pool.query(
      `INSERT INTO admin.sesion (correo_usuario, token_hash, fecha_vencimiento)
       VALUES ($1, $2, $3)`,
      [correoUsuario, tokenHash, venceEn]
    );
  }

  /** RF-53 — dueño de una sesión vigente, o `null`. */
  async buscarUsuarioPorSesion(tokenHash) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, ${ROL_DEL_USUARIO}
       FROM   admin.sesion  s
       JOIN   admin.usuario u ON u.correo = s.correo_usuario
       WHERE  s.token_hash = $1
         AND  s.fecha_vencimiento > now()`,
      [tokenHash]
    );
    return rows[0] ?? null;
  }
}
