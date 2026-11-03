/**
 * CAPA DE DOMINIO — Carrito del cliente (HU-10, RF-21 a RF-24).
 *
 * El carrito vive en la base y se conserva entre sesiones (RN-14). El
 * precio y el impuesto se guardan al agregar; el catálogo dice si el
 * producto está a la venta y cuántas unidades hay.
 */

import {
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../../shared/errores/errores-de-dominio.js";
import { validarCantidad, validarLinea } from "./validar-linea.js";

const CARRITO_VACIO = Object.freeze({ numCarrito: null, lineas: [], subtotal: 0, impuesto: 0, total: 0 });

export class CarritoService {
  #repositorio;
  #productosParaVenta;

  constructor({ repositorio, productosParaVenta }) {
    this.#repositorio = repositorio;
    this.#productosParaVenta = productosParaVenta;
  }

  /** RF-24: el carrito activo con sus líneas y totales, o uno vacío. */
  async verCarrito(correo) {
    const carrito = await this.#repositorio.obtenerCarritoActivo(correo);
    if (!carrito || carrito.lineas.length === 0) return { ...CARRITO_VACIO, numCarrito: carrito?.numCarrito ?? null };

    const productos = await this.#productosParaVenta(carrito.lineas.map(({ sku }) => sku));
    const lineas = carrito.lineas.map((linea) => conDatosDelProducto(linea, productos.get(linea.sku)));
    return { numCarrito: carrito.numCarrito, lineas, ...totales(lineas) };
  }

  /**
   * RF-21, RF-22, RF-23: agrega un producto o suma a la línea que ya tiene.
   * El carrito se crea con el primer producto.
   */
  async agregarLinea(correo, datos) {
    const { sku, cantidad } = validarLinea(datos);
    const producto = await this.#productoALaVenta(sku);

    const carrito = await this.#repositorio.obtenerCarritoActivo(correo);
    const yaTenia = carrito?.lineas.find((linea) => linea.sku === sku)?.cantidad ?? 0;
    exigirExistencias(producto, yaTenia + cantidad);

    const numCarrito = carrito?.numCarrito ?? (await this.#repositorio.abrirCarrito(correo));
    await this.#repositorio.guardarLinea(correo, numCarrito, {
      sku,
      cantidad: yaTenia + cantidad,
      // C-07: precio sin impuesto y tasa del momento en que se agrega
      precioUnitario: producto.precioSinImpuesto,
      tasaImpuesto: producto.tasaImpuesto,
    });
    return this.verCarrito(correo);
  }

  /** Deja la línea con la cantidad pedida, con la misma regla de existencias. */
  async cambiarCantidad(correo, sku, datos) {
    const cantidad = validarCantidad(datos);
    const { carrito, linea } = await this.#lineaDelCarrito(correo, sku);
    const producto = await this.#productoALaVenta(sku);
    exigirExistencias(producto, cantidad);

    await this.#repositorio.guardarLinea(correo, carrito.numCarrito, { ...linea, cantidad });
    return this.verCarrito(correo);
  }

  async quitarLinea(correo, sku) {
    const { carrito } = await this.#lineaDelCarrito(correo, sku);
    await this.#repositorio.quitarLinea(correo, carrito.numCarrito, sku);
    return this.verCarrito(correo);
  }

  async #lineaDelCarrito(correo, sku) {
    const carrito = await this.#repositorio.obtenerCarritoActivo(correo);
    const linea = carrito?.lineas.find((l) => l.sku === sku);
    if (!linea) throw new RecursoNoEncontrado("la línea del carrito", sku);
    return { carrito, linea };
  }

  // RN-03: lo descontinuado, de una familia inactiva o sin existencias ni contrapedido no se vende
  async #productoALaVenta(sku) {
    const producto = (await this.#productosParaVenta([sku])).get(sku);
    if (!producto) throw new RecursoNoEncontrado("el producto", sku);
    if (!producto.aLaVenta) throw new ReglaDeNegocioViolada(`${producto.nombre} no está a la venta.`, "RN-03");
    return producto;
  }
}

/** RN-13: sin contrapedido no se puede pedir más de lo que hay. */
function exigirExistencias(producto, cantidad) {
  if (!producto.admiteContrapedido && cantidad > producto.existencias) {
    throw new ReglaDeNegocioViolada(`El máximo disponible es ${producto.existencias}.`, "RN-13");
  }
}

function conDatosDelProducto(linea, producto) {
  const subtotal = redondear(linea.precioUnitario * linea.cantidad);
  return {
    sku: linea.sku,
    nombre: producto?.nombre ?? linea.sku,
    imagenUrl: producto?.imagenUrl ?? null,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    tasaImpuesto: linea.tasaImpuesto,
    subtotal,
    impuesto: redondear((subtotal * linea.tasaImpuesto) / 100),
    // RF-23: lo que pasa de las existencias se entrega por contrapedido
    contrapedido: producto ? linea.cantidad > producto.existencias : false,
  };
}

function totales(lineas) {
  const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0));
  const impuesto = redondear(lineas.reduce((suma, linea) => suma + linea.impuesto, 0));
  return { subtotal, impuesto, total: redondear(subtotal + impuesto) };
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
