/**
 * Pool de conexiones a PostgreSQL.
 *
 * Es el único lugar del sistema donde se abre una conexión. No se expone
 * como Singleton global (§ 4.5): se crea en la raíz de composición y se
 * inyecta, de modo que una prueba pueda levantar su propio pool contra
 * otra base.
 */

import pg from "pg";

export function crearPool({ host, puerto, nombre, usuario, contrasena }) {
  return new pg.Pool({
    host,
    port: puerto,
    database: nombre,
    user: usuario,
    password: contrasena,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}
