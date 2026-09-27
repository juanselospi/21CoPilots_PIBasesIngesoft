/**
 * CAPA DE DOMINIO — Carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   RF-21..RF-24  Carrito persistente; no exceder existencias salvo
 *                 contrapedido (RN-13); se conserva indefinidamente (RN-14)
 *   RF-25         Confirmar pedido (recorrido completo en § 10.2)
 *   RF-26, RF-27  Estados del pedido y su visibilidad para el cliente
 *   RF-28         Cancelar antes del despacho y devolver unidades (RN-15)
 *   RF-29         Sin límite de pedidos activos (RN-12)
 *   RF-30, RF-31  Concurrencia y comprobante
 *
 * Reglas al implementar:
 *   · Las transiciones de estado salen de `estados/maquina-de-estados.js`
 *     (State, § 6.4); no escribir `if (estado === ...)` en este archivo.
 *   · Confirmar un pedido es UNA transacción que bloquea las existencias
 *     en orden de `producto_id`, crea el pedido y sus líneas con el precio
 *     copiado, registra el historial y los movimientos (§ 7.3, § 10.2).
 *   · Los eventos se publican DESPUÉS del COMMIT (§ 6.2).
 *   · El cobro y la factura se piden a las interfaces, que llegan ya
 *     construidas. Está prohibido importar un adaptador concreto desde
 *     este archivo (RNF-20, Bridge § 5.2).
 *   · Si el cobro o la factura no están disponibles, el pedido igual se
 *     registra y el inventario igual se mueve (RNF-06).
 *   · El precio se calcula con `motorDePrecios`, y el descuento con la
 *     estrategia que entrega `clientes.obtenerEstrategiaDeDescuento()`:
 *     no reimplementar ninguna de las dos.
 */

export class PedidosService {
  #repositorio;
  #inventario;
  #clientes;
  #busDeEventos;
  #motorDePrecios;
  #pasarelaDePago;
  #facturacionElectronica;

  constructor({
    repositorio,
    inventario,
    clientes,
    busDeEventos,
    motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
  }) {
    this.#repositorio = repositorio;
    this.#inventario = inventario;
    this.#clientes = clientes;
    this.#busDeEventos = busDeEventos;
    this.#motorDePrecios = motorDePrecios;
    this.#pasarelaDePago = pasarelaDePago;
    this.#facturacionElectronica = facturacionElectronica;
  }
}
