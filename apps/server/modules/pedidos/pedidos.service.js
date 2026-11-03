/**
 * CAPA DE DOMINIO — Carrito y pedidos.
 *
 * El carrito está en carrito/carrito.service.js.
 *
 * POR IMPLEMENTAR
 *   RF-26, RF-27  Estados del pedido y su visibilidad para el cliente
 *   RF-28         Cancelar antes del despacho y devolver unidades (RN-15);
 *                 solo lo hace el administrador
 *   RF-29         Sin límite de pedidos activos (RN-12)
 *   RF-31         Comprobante
 *
 * Confirmar es una sola transacción: bloquea el stock de cada línea, lo
 * descuenta, pasa el carrito a `convertido`, inserta el pedido y su primer
 * estado (`colocado`) en el historial, y después cobra. Si el cobro se
 * rechaza se revierte todo y el carrito queda como estaba.
 */

import {
  PagoRechazado,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
  SinExistencias,
} from "../../shared/errores/errores-de-dominio.js";
import { randomUUID } from "node:crypto";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { MODALIDADES, totalConEntrega, validarEntrega } from "./entrega/modalidades-de-entrega.js";
import { validarConfirmacion } from "./confirmacion/validar-confirmacion.js";

export class PedidosService {
  #repositorio;
  #inventario;
  #clientes;
  #busDeEventos;
  #motorDePrecios;
  #pasarelaDePago;
  #facturacionElectronica;
  #productosParaVenta;
  #pagos;

  constructor({
    repositorio,
    inventario,
    clientes,
    busDeEventos,
    motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
    productosParaVenta,
    pagos,
  }) {
    this.#repositorio = repositorio;
    this.#inventario = inventario;
    this.#clientes = clientes;
    this.#busDeEventos = busDeEventos;
    this.#motorDePrecios = motorDePrecios;
    this.#pasarelaDePago = pasarelaDePago;
    this.#facturacionElectronica = facturacionElectronica;
    this.#productosParaVenta = productosParaVenta;
    this.#pagos = pagos;
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

  /**
   * RF-25, RF-30: convierte el carrito activo en un pedido, todo o nada.
   * Bloquea el carrito y los productos (en orden de SKU), revisa las
   * existencias, congela el precio vigente, descuenta el stock, crea el
   * pedido en «colocado», suma la compra al cliente y cobra. Si el cobro se
   * rechaza se revierte todo y el carrito queda como estaba (RF-39).
   */
  async confirmar(correo, datos) {
    const { modalidadEntrega, direccion, metodoPago, datosTarjeta } = validarConfirmacion(datos);
    const { costoEntrega } = await this.cotizarEntrega({ modalidadEntrega, direccion });

    const { pedido, movimientos } = await this.#repositorio.enTransaccion(async (cliente) => {
      const carrito = await this.#repositorio.bloquearCarritoActivo(cliente, correo);
      if (!carrito || carrito.lineas.length === 0) {
        throw new ReglaDeNegocioViolada("Su carrito está vacío.", "RF-25");
      }
      const skus = carrito.lineas.map(({ sku }) => sku);

      // El stock se lee ya bloqueado: si otro cliente compró la última unidad, aquí se ve
      const stock = await this.#inventario.bloquearEnTransaccion(cliente, skus);
      const productos = await this.#productosParaVenta(skus);
      const faltantes = lineasSinExistencias(carrito.lineas, stock, productos);
      if (faltantes.length > 0) throw new SinExistencias(faltantes);

      const lineas = carrito.lineas.map((linea) => {
        const producto = productos.get(linea.sku);
        return {
          ...linea,
          nombre: producto.nombre,
          precioUnitario: producto.precioSinImpuesto,
          tasaImpuesto: producto.tasaImpuesto,
          precioFinal: producto.precioFinal,
        };
      });

      const movimientos = [];
      for (const linea of lineas) {
        await this.#repositorio.congelarPrecio(cliente, correo, carrito.numCarrito, linea);
        // Con contrapedido se descuenta lo que hay; el resto llega después
        const salen = Math.min(linea.cantidad, Number(stock.get(linea.sku).stock));
        if (salen > 0) {
          const salida = { sku: linea.sku, cantidad: -salen, tipo: "venta_en_linea" };
          movimientos.push(await this.#inventario.registrarEnTransaccion(cliente, salida));
        }
      }

      const fecha = await this.#repositorio.crearPedido(cliente, {
        correo,
        numCarrito: carrito.numCarrito,
        modalidadEntrega,
        direccion,
        costoEntrega,
      });
      await this.#clientes.sumarCompra(cliente, correo);

      const montos = totalesDelPedido(lineas, costoEntrega);
      const pago = await this.#pasarelaDePago.cobrar({
        correoCliente: correo,
        numCarrito: carrito.numCarrito,
        monto: montos.total,
        metodo: metodoPago,
        datosTarjeta,
      });
      // Lanzar aquí revierte la transacción completa
      if (pago.resultado === "rechazado") throw new PagoRechazado(pago.motivo);

      // Sin referencia de la pasarela (contra entrega o no disponible) se usa una local
      const pagoGuardado = await this.#pagos.registrar(cliente, {
        numReferencia: pago.referencia ?? `LOCAL-${randomUUID()}`,
        monto: montos.total,
        metodoPago,
        estadoPago: pago.resultado === "aprobado" ? "aprobado" : "pendiente",
        correoCliente: correo,
        numCarrito: carrito.numCarrito,
      });

      return {
        movimientos,
        pedido: {
          correoCliente: correo,
          numCarrito: carrito.numCarrito,
          fecha,
          estado: "colocado",
          modalidadEntrega,
          direccion,
          metodoPago,
          lineas,
          ...montos,
          pago: { resultado: pagoGuardado.estadoPago, referencia: pagoGuardado.numReferencia },
        },
      };
    });

    // Se avisa después de confirmar, para no anunciar algo que se revirtió
    await this.#inventario.publicarMovimientos(movimientos, { responsable: correo });
    await this.#busDeEventos.publicar(EVENTOS.PEDIDO_CONFIRMADO, {
      correoUsuario: correo,
      entidad: "pedido",
      entidadId: `${correo}/${pedido.numCarrito}`,
      valorAnterior: null,
      valorNuevo: { total: pedido.total, metodoPago, pago: pedido.pago.resultado },
    });
    return pedido;
  }

  /** RF-40: los pagos de un pedido del cliente; 404 si el pedido no es suyo. */
  async listarPagos(correo, numCarrito) {
    if (!(await this.#repositorio.existePedido(correo, numCarrito))) {
      throw new RecursoNoEncontrado("el pedido", numCarrito);
    }
    return this.#pagos.listarPorPedido(correo, numCarrito);
  }
}

/** Las líneas que piden más de lo que hay sin contrapedido, o que ya no están a la venta. */
function lineasSinExistencias(lineas, stock, productos) {
  return lineas
    .filter(({ sku, cantidad }) => {
      const producto = productos.get(sku);
      const disponibles = Number(stock.get(sku)?.stock ?? 0);
      return !producto?.aLaVenta || (!producto.admiteContrapedido && cantidad > disponibles);
    })
    .map(({ sku, cantidad }) => ({ sku, solicitadas: cantidad, disponibles: Number(stock.get(sku)?.stock ?? 0) }));
}

/** El total de cada línea sale del precio final, igual que en el carrito; el envío se suma aparte (RN-16). */
function totalesDelPedido(lineas, costoEntrega) {
  const subtotal = redondear(lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0));
  const conImpuesto = redondear(lineas.reduce((suma, l) => suma + redondear(l.precioFinal * l.cantidad), 0));
  const impuesto = redondear(conImpuesto - subtotal);
  return { subtotal, impuesto, costoEntrega, total: totalConEntrega({ subtotal, impuesto, costoEntrega }) };
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
