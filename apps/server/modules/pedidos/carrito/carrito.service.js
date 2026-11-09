/**
 * CAPA DE DOMINIO: Carrito del cliente (HU-10, RF-21 a RF-24).
 *
 * El carrito vive en la base y se conserva entre sesiones (RN-14). En el
 * carrito el precio es siempre el vigente: cada consulta lo recalcula con el
 * motor de precios y lo actualiza. Solo se congela al confirmar el pedido.
 */

import {
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../../shared/errores/errores-de-dominio.js";
import { validarCantidad, validarLinea } from "./validar-linea.js";

const CARRITO_VACIO = Object.freeze({ numCarrito: null, lineas: [], subtotal: 0, impuesto: 0, total: 0 });

/** Cómo está cada línea frente a las existencias de hoy. */
export const DISPONIBILIDAD_DE_LINEA = Object.freeze({
  EN_EXISTENCIA: "en_existencia",
  CONTRAPEDIDO: "contrapedido",
  FUERA_DE_STOCK: "fuera_de_stock",
});

export class CarritoService {
  #repositorio;
  #productosParaVenta;

  constructor({ repositorio, productosParaVenta }) {
    this.#repositorio = repositorio;
    this.#productosParaVenta = productosParaVenta;
  }

  /**
   * RF-24: el carrito activo con el precio vigente de cada línea, su
   * disponibilidad y los totales, o uno vacío. Si el precio cambió desde
   * que se agregó, se guarda el nuevo.
   */
  async verCarrito(correo) {
    const carrito = await this.#repositorio.obtenerCarritoActivo(correo);
    if (!carrito || carrito.lineas.length === 0) return { ...CARRITO_VACIO, numCarrito: carrito?.numCarrito ?? null };

    const productos = await this.#productosParaVenta(carrito.lineas.map(({ sku }) => sku));
    const lineas = [];
    for (const guardada of carrito.lineas) {
      const producto = productos.get(guardada.sku);
      const linea = conPrecioVigente(guardada, producto);
      if (linea.precioUnitario !== guardada.precioUnitario || linea.tasaImpuesto !== guardada.tasaImpuesto) {
        await this.#repositorio.guardarLinea(correo, carrito.numCarrito, linea);
      }
      lineas.push(conDatosDelProducto(linea, producto));
    }
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

// Un producto que ya no existe conserva el último precio guardado
function conPrecioVigente(linea, producto) {
  if (!producto) return linea;
  return { ...linea, precioUnitario: producto.precioSinImpuesto, tasaImpuesto: producto.tasaImpuesto };
}

function conDatosDelProducto(linea, producto) {
  const subtotal = redondear(linea.precioUnitario * linea.cantidad);
  // El total sale del precio final del catálogo, para que cuadre al centavo con la tienda
  const total = producto
    ? redondear(producto.precioFinal * linea.cantidad)
    : redondear(subtotal * (1 + linea.tasaImpuesto / 100));
  const disponibilidad = disponibilidadDeLinea(linea, producto);
  return {
    sku: linea.sku,
    nombre: producto?.nombre ?? linea.sku,
    imagenUrl: producto?.imagenUrl ?? null,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    precioFinal: producto?.precioFinal ?? null,
    tasaImpuesto: linea.tasaImpuesto,
    subtotal,
    impuesto: redondear(total - subtotal),
    disponibilidad,
    contrapedido: disponibilidad === DISPONIBILIDAD_DE_LINEA.CONTRAPEDIDO,
    existencias: producto?.existencias ?? 0,
  };
}

/**
 * RF-23: lo que pasa de las existencias va por contrapedido si el producto
 * lo admite; si no, o si ya no está a la venta, la línea no se puede comprar.
 */
function disponibilidadDeLinea(linea, producto) {
  if (!producto || !producto.aLaVenta) return DISPONIBILIDAD_DE_LINEA.FUERA_DE_STOCK;
  if (linea.cantidad <= producto.existencias) return DISPONIBILIDAD_DE_LINEA.EN_EXISTENCIA;
  return producto.admiteContrapedido ? DISPONIBILIDAD_DE_LINEA.CONTRAPEDIDO : DISPONIBILIDAD_DE_LINEA.FUERA_DE_STOCK;
}

function totales(lineas) {
  const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0));
  const impuesto = redondear(lineas.reduce((suma, linea) => suma + linea.impuesto, 0));
  return { subtotal, impuesto, total: redondear(subtotal + impuesto) };
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
