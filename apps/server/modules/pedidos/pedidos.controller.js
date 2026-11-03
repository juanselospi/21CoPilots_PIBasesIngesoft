/**
 * CAPA DE API — Controlador de carrito y pedidos.
 *
 * POR IMPLEMENTAR
 *   confirmar                                                   RF-25
 *   consultarEstado                                             RF-27
 *   listarMisPedidos                                            RF-37
 *   listarParaAdministracion / cambiarEstado                    RF-26, RF-28, RF-46
 */

import { aCarrito, aModalidad } from "./pedidos.dto.js";

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
}
