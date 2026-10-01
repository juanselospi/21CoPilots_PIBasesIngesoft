/**
 * Catálogo de eventos de dominio.
 *
 * Los nombres viven en un solo archivo para que quien publica y quien se
 * suscribe no dependan de una cadena escrita a mano en dos lugares.
 *
 * Los valores van en snake_case y en espanol para que la bitacora los pueda
 * guardar tal cual cuando se defina donde se guarda.
 */

export const EVENTOS = Object.freeze({
  /** RF-15 — toda venta, por cualquier canal, mueve el inventario. */
  MOVIMIENTO_REGISTRADO: "movimiento_registrado",
  /** RF-16 / RN-04 — existencias en el umbral o por debajo. */
  EXISTENCIAS_BAJAS: "existencias_bajas",

  /** RF-25 */
  PEDIDO_CONFIRMADO: "pedido_confirmado",
  /** RF-26 / RF-27 */
  ESTADO_DE_PEDIDO_CAMBIADO: "estado_pedido_cambiado",
  /** RF-28 / RN-15 — las unidades regresan al inventario. */
  PEDIDO_CANCELADO: "pedido_cancelado",

  /** RF-51 — cambio de precio, margen o descuento. */
  PARAMETRO_MODIFICADO: "parametro_modificado",
  /** RNF-10 — el 100 % de los intentos no autorizados debe registrarse. */
  ACCESO_DENEGADO: "acceso_denegado",
});
