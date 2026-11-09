/**
 * CAPA DE API: Controlador de carrito y pedidos.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import {
  aCarrito,
  aFactura,
  aMiPedido,
  aMiPedidoEnListado,
  aModalidad,
  aPago,
  aPedidoAdministrativo,
  aPedidoConfirmado,
  aPedidoEnListado,
} from "./pedidos.dto.js";

export class PedidosController {
  #servicio;
  #carrito;
  #edicion;

  constructor({ servicio, carrito, edicion }) {
    this.#servicio = servicio;
    this.#carrito = carrito;
    this.#edicion = edicion;
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

  // GET /:numCarrito/factura, del cliente dueño del pedido
  verFactura = async (peticion, respuesta) => {
    const numCarrito = leerNumeroDeCarrito(peticion.params.numCarrito);
    const factura = await this.#servicio.obtenerFactura(peticion.usuario.correo, numCarrito);
    respuesta.json({ datos: aFactura(factura) });
  };

  // GET / los pedidos del cliente con sesion
  listarMisPedidos = async (peticion, respuesta) => {
    const pedidos = await this.#servicio.listarMisPedidos(peticion.usuario.correo);
    respuesta.json({ datos: pedidos.map(aMiPedidoEnListado) });
  };

  // GET /:numCarrito, el correo sale de la sesion asi que nadie puede ver el pedido de otro
  verMiPedido = async (peticion, respuesta) => {
    const numCarrito = leerNumeroDeCarrito(peticion.params.numCarrito);
    const pedido = await this.#servicio.obtenerParaAdministracion(peticion.usuario.correo, numCarrito);
    respuesta.json({ datos: aMiPedido(pedido) });
  };

  // GET /admin?estado&canal&correo&q&desde&hasta&pagina&limite
  listarParaAdministracion = async (peticion, respuesta) => {
    const { pedidos, total, pagina, limite } = await this.#servicio.listarParaAdministracion(peticion.query);
    respuesta.json({ datos: pedidos.map(aPedidoEnListado), meta: { total, pagina, limite } });
  };

  // POST /admin con { correoCliente | clienteNuevo, lineas, canal, modalidadEntrega, direccion, metodoPago }
  registrarPedidoManual = async (peticion, respuesta) => {
    const pedido = await this.#servicio.registrarPedidoManual(peticion.body ?? {}, { responsable: peticion.usuario.correo });
    respuesta.status(201).json({ datos: aPedidoAdministrativo(pedido) });
  };

  // GET /admin/:correo/:numCarrito
  verParaAdministracion = async (peticion, respuesta) => {
    const { correo, numCarrito } = leerPedido(peticion.params);
    const pedido = await this.#servicio.obtenerParaAdministracion(correo, numCarrito);
    respuesta.json({ datos: aPedidoAdministrativo(pedido) });
  };

  // POST /admin/:correo/:numCarrito/estado con { estado }
  cambiarEstado = async (peticion, respuesta) => {
    const { correo, numCarrito } = leerPedido(peticion.params);
    const pedido = await this.#servicio.cambiarEstado(correo, numCarrito, peticion.body ?? {}, {
      responsable: peticion.usuario.correo,
    });
    respuesta.json({ datos: aPedidoAdministrativo(pedido) });
  };

  // PATCH /admin/:correo/:numCarrito/lineas/:sku con { cantidad }
  cambiarCantidadDelPedido = async (peticion, respuesta) => {
    await this.#editarYResponder(peticion, respuesta, ({ correo, numCarrito, sku }, opciones) =>
      this.#edicion.cambiarCantidad(correo, numCarrito, sku, peticion.body ?? {}, opciones)
    );
  };

  // DELETE /admin/:correo/:numCarrito/lineas/:sku
  quitarLineaDelPedido = async (peticion, respuesta) => {
    await this.#editarYResponder(peticion, respuesta, ({ correo, numCarrito, sku }, opciones) =>
      this.#edicion.quitarLinea(correo, numCarrito, sku, opciones)
    );
  };

  // POST /admin/:correo/:numCarrito/lineas con { sku, cantidad }
  agregarLineaAlPedido = async (peticion, respuesta) => {
    await this.#editarYResponder(
      peticion,
      respuesta,
      ({ correo, numCarrito }, opciones) => this.#edicion.agregarLinea(correo, numCarrito, peticion.body ?? {}, opciones),
      201
    );
  };

  // POST /admin/:correo/:numCarrito/lineas/:sku/reemplazo con { skuNuevo }
  reemplazarLineaDelPedido = async (peticion, respuesta) => {
    await this.#editarYResponder(peticion, respuesta, ({ correo, numCarrito, sku }, opciones) =>
      this.#edicion.reemplazarLinea(correo, numCarrito, sku, peticion.body ?? {}, opciones)
    );
  };

  // Después de cada cambio el panel recibe el pedido completo, con los montos nuevos
  async #editarYResponder(peticion, respuesta, editar, estado = 200) {
    const pedido = leerPedido(peticion.params);
    const sku = peticion.params.sku?.trim().toUpperCase();
    await editar({ ...pedido, sku }, { responsable: peticion.usuario.correo });
    const actualizado = await this.#servicio.obtenerParaAdministracion(pedido.correo, pedido.numCarrito);
    respuesta.status(estado).json({ datos: aPedidoAdministrativo(actualizado) });
  }
}

function leerPedido(params) {
  return { correo: params.correo.trim().toLowerCase(), numCarrito: leerNumeroDeCarrito(params.numCarrito) };
}

function leerNumeroDeCarrito(valor) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1) {
    throw new EntradaInvalida("El número de pedido tiene que ser un entero mayor que 0.", ["numCarrito"]);
  }
  return numero;
}
