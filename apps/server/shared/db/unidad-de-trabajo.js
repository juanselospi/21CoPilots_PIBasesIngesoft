/**
 * Unidad de trabajo (Unit of Work).
 *
 * Ejecuta varias operaciones de repositorio dentro de una sola
 * transacción: o se confirman todas, o no se confirma ninguna.
 *
 * Es obligatoria para confirmar un pedido (RF-25, RF-30): descontar el stock,
 * cerrar el carrito y crear el pedido con su historial tienen que ser atomicos (§ 10.2).
 * El candado sobre el stock de catalogo.producto se toma dentro de esta misma
 * transaccion (§ 7.3) con SELECT ... FOR UPDATE.
 *
 * Los eventos del bus se publican DESPUÉS de que esta función devuelve,
 * es decir, después del COMMIT (§ 6.2).
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
