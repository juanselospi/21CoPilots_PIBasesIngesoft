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
