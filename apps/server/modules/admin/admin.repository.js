/**
 * CAPA DE PERSISTENCIA — Repositorio de administración.
 *
 * Escribe solo en el esquema `admin` (§ 9.3): usuario, administrador y sesion.
 * El usuario se identifica por su correo, que la base guarda en minusculas y sin espacios.
 * El rol no es una columna, sale de si el correo esta en admin.administrador o en clientes.cliente.
 *
 * POR IMPLEMENTAR
 *   crearUsuario()             RF-49 — una sola cuenta de administrador (índice único)
 *   borrarSesion()             cierre de sesion, se borra la fila por el hash del token
 *
 * RNF-08: la contraseña llega ya transformada con hash; este repositorio
 * jamás recibe ni devuelve una contraseña en claro.
 */

const ROL_DEL_USUARIO = `
       CASE WHEN a.correo_usuario IS NOT NULL THEN 'administrador'
            WHEN c.correo_usuario IS NOT NULL THEN 'cliente'
       END AS rol`;

const ESPECIALIZACIONES_DEL_USUARIO = `
  LEFT JOIN admin.administrador a ON a.correo_usuario = u.correo
  LEFT JOIN clientes.cliente    c ON c.correo_usuario = u.correo`;

export class AdminRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** RF-50, RF-53 — el correo tiene que venir normalizado. Incluye el hash para el servicio. */
  // Se busca al usuario usando el correo normalizado
  async buscarUsuarioPorCorreo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, u.contrasena, ${ROL_DEL_USUARIO}
         FROM admin.usuario u
       ${ESPECIALIZACIONES_DEL_USUARIO}
        WHERE u.correo = $1`,
      [correo]
    );

    // Si no lo encuentra retorna null que es que no existe
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
         FROM admin.sesion s
         JOIN admin.usuario u ON u.correo = s.correo_usuario
       ${ESPECIALIZACIONES_DEL_USUARIO}
        WHERE s.token_hash = $1
          AND s.fecha_vencimiento > now()`,
      [tokenHash]
    );

    // Si no se enceuntra la usuario por token de sesion como dice el comentario generado
    // de lo que hay que implementar simplemente se asume que no existe
    return rows[0] ?? null;
  }
}
