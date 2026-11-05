/**
 * CAPA DE PERSISTENCIA —> Repositorio de administración.
 *
 * Escribe en `usuarios.usuario`, `usuarios.sesion` y `admin.administrador`.
 * El usuario se identifica por su correo, que la base guarda en minusculas y sin espacios.
 * El rol no es una columna, sale de si el correo esta en admin.administrador o en clientes.cliente.
 *
 * La contraseña llega ya transformada con hash; este repositorio jamás recibe ni devuelve una contraseña en limpio.
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

// Una cuenta de administrador desactivada ya no tiene ese rol
const ROL_DEL_USUARIO = `
       CASE WHEN a.correo_usuario IS NOT NULL AND a.activo THEN 'administrador'
            WHEN c.correo_usuario IS NOT NULL THEN 'cliente'
       END AS rol,
       coalesce(a.es_propietario AND a.activo, false) AS "esPropietario"`;

const ESPECIALIZACIONES_DEL_USUARIO = `
  LEFT JOIN admin.administrador a ON a.correo_usuario = u.correo
  LEFT JOIN clientes.cliente    c ON c.correo_usuario = u.correo`;

export class AdminRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** El correo tiene que venir normalizado. Incluye el hash para el servicio. */
  // Se busca al usuario usando el correo normalizado
  async buscarUsuarioPorCorreo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, u.contrasena, ${ROL_DEL_USUARIO}
         FROM usuarios.usuario u
       ${ESPECIALIZACIONES_DEL_USUARIO}
        WHERE u.correo = $1`,
      [correo]
    );

    // Si no lo encuentra retorna null que es que no existe
    if (!rows[0]) return null;

    const { contrasena: contrasenaHash, ...usuario } = rows[0];
    return { ...usuario, contrasenaHash };
  }

  /** Se guarda el hash del token, nunca el token. */
  async crearSesion({ correoUsuario, tokenHash, venceEn }) {
    await this.#pool.query(
      `INSERT INTO usuarios.sesion (correo_usuario, token_hash, fecha_vencimiento)
       VALUES ($1, $2, $3)`,
      [correoUsuario, tokenHash, venceEn]
    );
  }

  /** Dueño de una sesión vigente y cuándo vence, o `null`. */
  async buscarUsuarioPorSesion(tokenHash) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, ${ROL_DEL_USUARIO}, s.fecha_vencimiento AS "venceEn"
         FROM usuarios.sesion s
         JOIN usuarios.usuario u ON u.correo = s.correo_usuario
       ${ESPECIALIZACIONES_DEL_USUARIO}
        WHERE s.token_hash = $1
          AND s.fecha_vencimiento > now()`,
      [tokenHash]
    );

    // Si no se enceuntra la usuario por token de sesion simplemente se asume que no existe.
    return rows[0] ?? null;
  }

  async extenderSesion(tokenHash, venceEn) {
    await this.#pool.query(
      `UPDATE usuarios.sesion SET fecha_vencimiento = $2 WHERE token_hash = $1`,
      [tokenHash, venceEn]
    );
  }

  async borrarSesion(tokenHash) {
    await this.#pool.query(`DELETE FROM usuarios.sesion WHERE token_hash = $1`, [tokenHash]);
  }

  // Las sesiones vencidas ya no sirven y solo ocupan espacio
  async borrarSesionesVencidas(correoUsuario) {
    await this.#pool.query(
      `DELETE FROM usuarios.sesion
        WHERE correo_usuario = $1
          AND fecha_vencimiento <= now()`,
      [correoUsuario]
    );
  }

  /**
   * Guarda el hash nuevo y cierra las demás sesiones del usuario en la misma
   * sentencia, así no queda la contraseña cambiada con sesiones viejas abiertas.
   */
  async cambiarContrasena({ correo, contrasenaHash, sesionQueSeQueda }) {
    await this.#pool.query(
      `WITH cambio AS (
         UPDATE usuarios.usuario SET contrasena = $2 WHERE correo = $1
       )
       DELETE FROM usuarios.sesion
        WHERE correo_usuario = $1
          AND token_hash <> $3`,
      [correo, contrasenaHash, sesionQueSeQueda]
    );
  }

  /**
   * Crea el usuario y su cuenta de administrador.
   * @returns false si el correo ya tiene un usuario
   */
  async crearEmpleado({ nombre, correo, contrasenaHash, creadoPor }) {
    return enTransaccion(this.#pool, async (cliente) => {
      const { rowCount } = await cliente.query(
        `INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES ($1, $2, $3)
         ON CONFLICT (correo) DO NOTHING`,
        [correo, contrasenaHash, nombre]
      );
      if (rowCount === 0) return false;

      await cliente.query(
        `INSERT INTO admin.administrador (correo_usuario, creado_por) VALUES ($1, $2)`,
        [correo, creadoPor]
      );
      return true;
    });
  }

  /** El propietario primero y después los empleados por nombre. */
  async listarAdministradores() {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, a.es_propietario, a.activo, a.creado_por
         FROM admin.administrador a
         JOIN usuarios.usuario u ON u.correo = a.correo_usuario
        ORDER BY a.es_propietario DESC, u.nombre`
    );
    return rows.map(aAdministrador);
  }

  async buscarAdministrador(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, a.es_propietario, a.activo, a.creado_por
         FROM admin.administrador a
         JOIN usuarios.usuario u ON u.correo = a.correo_usuario
        WHERE a.correo_usuario = $1`,
      [correo]
    );
    return rows[0] ? aAdministrador(rows[0]) : null;
  }

  /** Al desactivar se cierran sus sesiones en la misma sentencia. */
  async cambiarActivo(correo, activo) {
    await this.#pool.query(
      `WITH cambio AS (
         UPDATE admin.administrador SET activo = $2 WHERE correo_usuario = $1
       )
       DELETE FROM usuarios.sesion WHERE correo_usuario = $1 AND NOT $2`,
      [correo, activo]
    );
  }

  /** RF-52: una fila de la bitácora. La fecha la pone la base con clock_timestamp(). */
  async registrarEnBitacora({ correoUsuario, evento, entidad, entidadId, valorAnterior, valorNuevo }) {
    await this.#pool.query(
      `INSERT INTO admin.bitacora (correo_usuario, evento, entidad, entidad_id, valor_anterior, valor_nuevo)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
      [correoUsuario, evento, entidad, entidadId, aJson(valorAnterior), aJson(valorNuevo)]
    );
  }

  /** La bitácora filtrada, de lo más nuevo a lo más viejo, con el total para paginar. */
  async listarBitacora({ entidad, entidadId, evento, correoUsuario, desde, hasta, limite, pagina }) {
    const { rows } = await this.#pool.query(
      `SELECT correo_usuario, fecha, evento, entidad, entidad_id, valor_anterior, valor_nuevo,
              count(*) OVER () AS total
         FROM admin.bitacora
        WHERE ($1::text IS NULL OR entidad = $1)
          AND ($2::text IS NULL OR entidad_id = $2)
          AND ($3::text IS NULL OR evento = $3)
          AND ($4::text IS NULL OR correo_usuario = $4)
          AND ($5::timestamptz IS NULL OR fecha >= $5)
          AND ($6::timestamptz IS NULL OR fecha < $6)
        ORDER BY fecha DESC
        LIMIT $7 OFFSET $8`,
      [entidad, entidadId, evento, correoUsuario, desde, hasta, limite, pagina * limite]
    );

    return {
      registros: rows.map((fila) => ({
        correoUsuario: fila.correo_usuario,
        fecha: fila.fecha,
        evento: fila.evento,
        entidad: fila.entidad,
        entidadId: fila.entidad_id,
        valorAnterior: fila.valor_anterior,
        valorNuevo: fila.valor_nuevo,
      })),
      total: Number(rows[0]?.total ?? 0),
    };
  }
}

const aAdministrador = (fila) => ({
  correo: fila.correo,
  nombre: fila.nombre,
  esPropietario: fila.es_propietario,
  activo: fila.activo,
  creadoPor: fila.creado_por,
});

const aJson = (valor) => (valor === null || valor === undefined ? null : JSON.stringify(valor));
