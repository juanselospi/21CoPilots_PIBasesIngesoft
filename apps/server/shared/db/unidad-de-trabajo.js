/**
 * Unidad de trabajo.
 *
 * Ejecuta varias operaciones de repositorio dentro de una sola transacción: o se confirman todas, o no se confirma ninguna.
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
