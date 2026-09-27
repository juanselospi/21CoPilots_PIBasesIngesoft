/**
 * Unidad de trabajo (Unit of Work).
 *
 * Ejecuta varias operaciones de repositorio dentro de una sola
 * transacción: o se confirman todas, o no se confirma ninguna.
 *
 * Es obligatoria para confirmar un pedido (RF-25, RF-30): descontar
 * existencias, crear el pedido y registrar el movimiento de inventario
 * deben ser atómicos (§ 10.2). El candado de fila sobre
 * `inventario.existencia` lo toma `InventarioRepository.bloquearExistencias`
 * dentro de esta misma transacción (§ 7.3); vive allá porque solo el
 * repositorio de inventario conoce ese esquema (§ 9.3).
 *
 * Los eventos del bus se publican DESPUÉS de que esta función devuelve,
 * es decir, después del COMMIT (§ 6.2).
 */

/**
 * @param {import('pg').Pool} pool
 * @param {(cliente: import('pg').PoolClient) => Promise<T>} trabajo
 * @returns {Promise<T>}
 * @template T
 */
export async function enTransaccion(pool, trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
