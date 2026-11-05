/**
 * Catálogo de eventos de dominio.
 *
 * Los nombres viven en un solo archivo para que quien publica y quien se
 * suscribe no dependan de una cadena escrita a mano en dos lugares.
 *
 * Los valores van en snake_case y en español porque la bitácora los guarda
 * tal cual en admin.bitacora.
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
  /** El administrador cambió las líneas de un pedido; va con el valor anterior y el nuevo. */
  PEDIDO_MODIFICADO: "pedido_modificado",
  /** Venta de otro canal o pedido que el administrador registró a mano (HU-09). */
  PEDIDO_CREADO_MANUAL: "pedido_creado_manual",

  /** RF-18: un producto pasa a descontinuado o vuelve a activo. */
  ESTADO_DE_PRODUCTO_CAMBIADO: "estado_producto_cambiado",
  /** Un producto sin historial se borró del catálogo. */
  PRODUCTO_ELIMINADO: "producto_eliminado",

  /** RF-51 — cambio de precio, margen o descuento. */
  PARAMETRO_MODIFICADO: "parametro_modificado",
  /** El propietario creó una cuenta de empleado. */
  EMPLEADO_CREADO: "empleado_creado",
  /** El propietario activó o desactivó la cuenta de un empleado. */
  ESTADO_DE_EMPLEADO_CAMBIADO: "estado_empleado_cambiado",

  /** RNF-10 — el 100 % de los intentos no autorizados debe registrarse. */
  ACCESO_DENEGADO: "acceso_denegado",
});
