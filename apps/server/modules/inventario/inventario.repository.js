/**
 * Repositorio de inventario.
 *
 * PENDIENTE: el EER corregido no tiene las tablas existencia ni movimiento que
 * menciona este encabezado. Hay que adaptarlo antes de implementar (ver cambios-siguiente-sprint.md):
 *   - el stock vive en catalogo.producto.stock, que es del modulo de catalogo, asi que
 *     bloquearlo y cambiarlo se le pide a la fachada de catalogo y no se hace aqui
 *   - los ingresos van en inventario.producto_administra (sku, correo_administrador,
 *     fecha, cantidad distinta de 0), que es solo insercion
 *   - la llave de producto_administra incluye la fecha y now() da la misma hora en toda
 *     la transaccion, entonces dos registros del mismo sku en una transaccion chocan,
 *     hay que usar clock_timestamp()
 *   - producto_administra no guarda costo ni motivo, RN-06, RF-14 y RF-20 siguen por definir
 *
 * Es el único lugar del sistema que escribe en el esquema `inventario`.
 * `existencia` guarda cuánto hay de cada producto y `movimiento` explica
 * cómo se llegó a ese número; las dos se escriben en la misma transacción.
 *
 * Falta implementar:
 *   - registrarMovimiento(): los ingresos llevan costo_unitario (RN-06)
 *   - actualizarExistencia(): siempre junto con registrarMovimiento()
 *   - listarMovimientos()
 *
 * Los movimientos no se pueden editar ni borrar (lo impide un trigger).
 * Un error se corrige con otro movimiento que lo compense.
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

/** Todo el trabajo debe ejecutarse dentro de una sola transacción. */
export class InventarioRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  // Se hace todo en esta sola transaccion
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }
}
