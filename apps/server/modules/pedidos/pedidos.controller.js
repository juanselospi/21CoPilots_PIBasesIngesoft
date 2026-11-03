/**
 * CAPA DE API — Controlador de carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   consultarEstado                                             RF-27
 *   listarMisPedidos                                            RF-37
 *   listarParaAdministracion / cambiarEstado                    RF-26, RF-28, RF-46
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { aCarrito, aModalidad, aPago, aPedidoConfirmado } from "./pedidos.dto.js";

export class PedidosController {
  #servicio;
  #carrito;

  constructor({ servicio, carrito }) {
    this.#servicio = servicio;
    this.#carrito = carrito;
  }

  // GET /carrito
  verCarrito = async (peticion, respuesta) => {
    respuesta.json({ datos: aCarrito(await this.#carrito.verCarrito(peticion.usuario.correo)) });
  };

  // POST /carrito/lineas con { sku, cantidad }
  agregarLinea = async (peticion, respuesta) => {
    const carrito = await this.#carrito.agregarLinea(peticion.usuario.correo, peticion.body ?? {});
    respuesta.status(201).json({ datos: aCarrito(carrito) });
  };

  // PATCH /carrito/lineas/:sku con { cantidad }
  cambiarCantidad = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    const carrito = await this.#carrito.cambiarCantidad(peticion.usuario.correo, sku, peticion.body ?? {});
    respuesta.json({ datos: aCarrito(carrito) });
  };

  // DELETE /carrito/lineas/:sku
  quitarLinea = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    respuesta.json({ datos: aCarrito(await this.#carrito.quitarLinea(peticion.usuario.correo, sku)) });
  };

  // GET /modalidades, pública para mostrar el costo antes de pagar
  listarModalidades = async (_peticion, respuesta) => {
    const modalidades = await this.#servicio.listarModalidades();
    respuesta.json({ datos: modalidades.map(aModalidad) });
  };

  // POST / con { modalidadEntrega, direccion, metodoPago, datosTarjeta? }
  confirmar = async (peticion, respuesta) => {
    const pedido = await this.#servicio.confirmar(peticion.usuario.correo, peticion.body ?? {});
    respuesta.status(201).json({ datos: aPedidoConfirmado(pedido) });
  };

  // GET /:numCarrito/pagos, del cliente dueño del pedido
  listarPagos = async (peticion, respuesta) => {
    const pagos = await this.#servicio.listarPagos(peticion.usuario.correo, leerNumeroDeCarrito(peticion.params.numCarrito));
    respuesta.json({ datos: pagos.map(aPago) });
  };
}

function leerNumeroDeCarrito(valor) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1) {
    throw new EntradaInvalida("El número de pedido tiene que ser un entero mayor que 0.", ["numCarrito"]);
  }
  return numero;
}
