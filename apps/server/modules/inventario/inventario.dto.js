/**
 * DTO + Mapper del inventario.
 *
 * Lista blanca de lo que sale por la API. Todas las vistas de este módulo
 * son administrativas: se sirven detrás de `exigirRol` (RNF-10).
 *
 * POR IMPLEMENTAR
 *   aMovimiento()      RF-19 — fecha, origen, cantidad, responsable
 *   aExistencias()     RF-16 — producto, existencias, estado de alerta
 *   aIngreso()         RF-13, RF-14 — incluye el costo de esa compra
 */

/** Producto con existencias bajas, para el aviso del panel. */
export const aAlerta = (producto) => ({
  sku: producto.sku,
  nombre: producto.nombre,
  familia: producto.familia,
  existencias: producto.existencias,
  admiteContrapedido: producto.admiteContrapedido,
});
