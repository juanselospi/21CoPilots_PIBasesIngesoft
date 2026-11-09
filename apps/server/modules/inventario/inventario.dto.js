/**
 * DTO + Mapper del inventario.
 *
 * Lista blanca de lo que sale por la API. Todas las vistas de este módulo
 * son administrativas: se sirven detrás de `exigirRol` (RNF-10).
 *
 * POR IMPLEMENTAR
 *   aExistencias()     RF-16: producto, existencias, estado de alerta
 */

/** Producto con existencias bajas, para el aviso del panel. */
export const aAlerta = (producto) => ({
  sku: producto.sku,
  nombre: producto.nombre,
  familia: producto.familia,
  existencias: producto.existencias,
  admiteContrapedido: producto.admiteContrapedido,
});

/** Movimiento recién registrado, con las existencias que quedaron. */
export const aMovimientoRegistrado = (movimiento) => ({
  sku: movimiento.sku,
  tipo: movimiento.tipo,
  cantidad: movimiento.cantidad,
  costoUnitario: movimiento.costoUnitario,
  motivo: movimiento.motivo,
  fecha: movimiento.fecha,
  existencias: movimiento.existenciasResultantes,
});

/** RF-19: una fila del historial. */
export const aMovimiento = (movimiento) => ({
  sku: movimiento.sku,
  nombre: movimiento.nombre,
  fecha: movimiento.fecha,
  tipo: movimiento.tipo,
  cantidad: movimiento.cantidad,
  costoUnitario: movimiento.costoUnitario,
  motivo: movimiento.motivo,
  responsable: movimiento.responsable,
});
