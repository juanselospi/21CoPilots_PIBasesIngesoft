/**
 * CAPA DE DOMINIO — Carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   RF-21..RF-24  Carrito persistente; no exceder existencias salvo
 *                 contrapedido (RN-13); se conserva indefinidamente (RN-14)
 *   RF-25         Confirmar pedido
 *   RF-26, RF-27  Estados del pedido y su visibilidad para el cliente
 *   RF-28         Cancelar antes del despacho y devolver unidades (RN-15);
 *                 solo lo hace el administrador
 *   RF-29         Sin límite de pedidos activos (RN-12)
 *   RF-30, RF-31  Concurrencia y comprobante
 *
 * Confirmar es una sola transacción: bloquea el stock de cada línea, lo
 * descuenta, pasa el carrito a `convertido`, inserta el pedido y su primer
 * estado (`colocado`) en el historial, y después cobra. Si el cobro se
 * rechaza se revierte todo y el carrito queda como estaba.
 */

import { RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";
import { MODALIDADES, validarEntrega } from "./entrega/modalidades-de-entrega.js";

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

  /** Las modalidades en el orden en que se muestran, cada una con su costo. */
  async listarModalidades() {
    const montos = new Map((await this.#repositorio.listarTarifas()).map(({ modalidad, monto }) => [modalidad, monto]));

    return Object.entries(MODALIDADES).map(([modalidad, { nombre, exigeDireccion }]) => ({
      modalidad,
      nombre,
      costo: montos.get(modalidad) ?? 0,
      exigeDireccion,
    }));
  }

  /**
   * Modalidad, dirección y costo de entrega listos para el pedido. La
   * confirmación lo guarda en pedido.costo_entrega y lo suma al total.
   */
  async cotizarEntrega(datos) {
    const entrega = validarEntrega(datos);
    const tarifa = (await this.#repositorio.listarTarifas()).find((t) => t.modalidad === entrega.modalidadEntrega);
    if (!tarifa) throw new RecursoNoEncontrado("la tarifa de envío", entrega.modalidadEntrega);

    return { ...entrega, costoEntrega: tarifa.monto };
  }
}
