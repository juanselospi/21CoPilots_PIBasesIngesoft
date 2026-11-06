/**
 * CAPA DE DOMINIO — Carrito y pedidos.
 *
 * El carrito está en carrito/carrito.service.js.
 *
 * POR IMPLEMENTAR
 *   RF-27         Visibilidad del estado para el cliente
 *   RF-29         Sin límite de pedidos activos (RN-12)
 *   RF-31         Comprobante
 *
 * Confirmar es una sola transacción: bloquea el stock de cada línea, lo
 * descuenta, pasa el carrito a `convertido`, inserta el pedido y su primer
 * estado (`colocado`) en el historial, y después cobra. Si el cobro se
 * rechaza se revierte todo y el carrito queda como estaba.
 */

import {
  EntradaInvalida,
  PagoRechazado,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
  SinExistencias,
} from "../../shared/errores/errores-de-dominio.js";
import { randomUUID } from "node:crypto";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { MODALIDADES, totalConEntrega, validarEntrega } from "./entrega/modalidades-de-entrega.js";
import { validarConfirmacion } from "./confirmacion/validar-confirmacion.js";
import { validarConsultaDePedidos } from "./administracion/validar-consulta-de-pedidos.js";
import { validarCambioDeEstado } from "./administracion/validar-cambio-de-estado.js";
import { admiteEdicion, ESTADOS, estadoAnterior, siguientesEstados, transicionar } from "./estados/maquina-de-estados.js";
import { idDelPedido, motivoDelPedido } from "./referencia-del-pedido.js";

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
  #facturas;
  #creditos;

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
    facturas,
    creditos,
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
    this.#facturas = facturas;
    this.#creditos = creditos;
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
    const { modalidadEntrega, direccion, metodoPago, datosTarjeta, usarCredito } = validarConfirmacion(datos);
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
          const salida = {
            sku: linea.sku,
            cantidad: -salen,
            tipo: "venta_en_linea",
            motivo: motivoDelPedido(correo, carrito.numCarrito),
          };
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

      // Primero el crédito a favor; lo que no cubra se cobra con el medio de pago
      const creditoUsado = usarCredito
        ? redondear(Math.min(await this.#clientes.bloquearSaldoDeCredito(cliente, correo), montos.total))
        : 0;
      const restante = redondear(montos.total - creditoUsado);
      if (restante > 0 && !metodoPago) {
        throw new EntradaInvalida(
          "Su crédito no alcanza para todo el pedido; elija un medio de pago para la diferencia.",
          ["metodoPago"]
        );
      }

      const pagosGuardados = [];
      if (creditoUsado > 0) {
        pagosGuardados.push(
          await this.#pagos.registrar(cliente, {
            numReferencia: `CREDITO-${randomUUID()}`,
            monto: creditoUsado,
            metodoPago: "credito",
            estadoPago: "aprobado",
            correoCliente: correo,
            numCarrito: carrito.numCarrito,
          })
        );
      }
      if (restante > 0) {
        const pago = await this.#pasarelaDePago.cobrar({
          correoCliente: correo,
          numCarrito: carrito.numCarrito,
          monto: restante,
          metodo: metodoPago,
          datosTarjeta,
        });
        // Lanzar aquí revierte la transacción completa, también el uso del crédito
        if (pago.resultado === "rechazado") throw new PagoRechazado(pago.motivo);

        // Sin referencia de la pasarela (contra entrega o no disponible) se usa una local
        pagosGuardados.push(
          await this.#pagos.registrar(cliente, {
            numReferencia: pago.referencia ?? `LOCAL-${randomUUID()}`,
            monto: restante,
            metodoPago,
            estadoPago: pago.resultado === "aprobado" ? "aprobado" : "pendiente",
            correoCliente: correo,
            numCarrito: carrito.numCarrito,
          })
        );
      }
      // El pago que se informa es el del medio de pago, o el del crédito si alcanzó solo
      const pagoGuardado = pagosGuardados.at(-1);

      // RF-41: con todo cobrado se emite la factura; contra entrega la tendrá al pagar
      const factura = pagosGuardados.every(({ estadoPago }) => estadoPago === "aprobado")
        ? await this.#facturar(cliente, {
            correo,
            numCarrito: carrito.numCarrito,
            numReferencia: pagoGuardado.numReferencia,
            lineas,
          })
        : null;

      return {
        movimientos,
        pedido: {
          correoCliente: correo,
          numCarrito: carrito.numCarrito,
          fecha,
          estado: "colocado",
          modalidadEntrega,
          direccion,
          metodoPago: metodoPago ?? "credito",
          lineas,
          ...montos,
          creditoUsado,
          pago: { resultado: pagoGuardado.estadoPago, referencia: pagoGuardado.numReferencia },
          factura: factura && { numFactura: factura.numFactura },
        },
      };
    });

    // Se avisa después de confirmar, para no anunciar algo que se revirtió
    await this.#inventario.publicarMovimientos(movimientos, { responsable: correo });
    await this.#busDeEventos.publicar(EVENTOS.PEDIDO_CONFIRMADO, {
      correoUsuario: correo,
      entidad: "pedido",
      entidadId: idDelPedido(correo, pedido.numCarrito),
      valorAnterior: null,
      valorNuevo: {
        total: pedido.total,
        metodoPago: pedido.metodoPago,
        pago: pedido.pago.resultado,
        creditoUsado: pedido.creditoUsado,
      },
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

  /**
   * RF-41: la factura del pedido como comprobante. Los montos salen de lo
   * que se cobró y de los precios congelados, no del precio de hoy.
   */
  async obtenerFactura(correo, numCarrito) {
    const factura = await this.#facturas.buscarPorPedido(correo, numCarrito);
    if (!factura) throw new RecursoNoEncontrado("la factura del pedido", numCarrito);

    const [emisor, receptor, guardadas, costoEntrega, cobrado] = await Promise.all([
      this.#facturas.obtenerEmisor(),
      this.#clientes.datosParaFactura(correo),
      this.#repositorio.lineasDelPedido(correo, numCarrito),
      this.#repositorio.costoDeEntrega(correo, numCarrito),
      this.#pagos.montoAprobado(correo, numCarrito),
    ]);
    const nombres = await this.#productosParaVenta(guardadas.map(({ sku }) => sku));
    const lineas = guardadas.map((linea) => ({
      ...linea,
      nombre: nombres.get(linea.sku)?.nombre ?? linea.sku,
      subtotal: redondear(linea.precioUnitario * linea.cantidad),
    }));

    const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0));
    // Si se pagó una parte con crédito, el total son los dos pagos
    const total = cobrado;
    return {
      ...factura,
      emisor,
      receptor,
      lineas,
      subtotal,
      impuesto: redondear(total - costoEntrega - subtotal),
      costoEntrega,
      total,
    };
  }

  /** RF-46: los pedidos del panel con su total para paginar. */
  async listarParaAdministracion(consulta) {
    const filtros = validarConsultaDePedidos(consulta);
    const { pedidos, total } = await this.#repositorio.listarParaAdministracion(filtros);
    return { pedidos: pedidos.map(conMontos), total, pagina: filtros.pagina, limite: filtros.limite };
  }

  /**
   * El pedido completo para el administrador: cliente, líneas con el precio
   * que se pagó, entrega, pagos, factura e historial de estados.
   */
  async obtenerParaAdministracion(correo, numCarrito) {
    const pedido = await this.#repositorio.obtenerParaAdministracion(correo, numCarrito);
    if (!pedido) throw new RecursoNoEncontrado("el pedido", idDelPedido(correo, numCarrito));

    const [contacto, guardadas, historial, pagos, factura, creditoOtorgado] = await Promise.all([
      this.#clientes.datosDeContacto(correo),
      this.#repositorio.lineasDelPedido(correo, numCarrito),
      this.#repositorio.historialDeEstados(correo, numCarrito),
      this.#pagos.listarPorPedido(correo, numCarrito),
      this.#facturas.buscarPorPedido(correo, numCarrito),
      this.#clientes.creditoOtorgadoPorPedido(correo, numCarrito),
    ]);
    const nombres = await this.#productosParaVenta(guardadas.map(({ sku }) => sku));

    return {
      ...conMontos(pedido),
      telefonos: contacto?.telefonos ?? [],
      lineas: guardadas.map((linea) => ({
        ...linea,
        nombre: nombres.get(linea.sku)?.nombre ?? linea.sku,
        subtotal: redondear(linea.precioUnitario * linea.cantidad),
      })),
      historial,
      estadosSiguientes: siguientesEstados(pedido.estado, estadoAnterior(historial)),
      lineasEditables: admiteEdicion(pedido.estado),
      pagos,
      factura,
      creditoOtorgado,
    };
  }

  /**
   * RF-26, RF-28: el administrador mueve el pedido a otro estado. Cancelar
   * devuelve al inventario lo que el pedido descontó, en la misma
   * transacción; el cliente no tiene ruta para hacerlo.
   * @returns el pedido como lo ve el panel después del cambio
   */
  async cambiarEstado(correo, numCarrito, datos, { responsable }) {
    const estadoNuevo = validarCambioDeEstado(datos);

    const { estadoPrevio, movimientos, credito } = await this.#repositorio.enTransaccion(async (cliente) => {
      if (!(await this.#repositorio.bloquearPedido(cliente, correo, numCarrito))) {
        throw new RecursoNoEncontrado("el pedido", idDelPedido(correo, numCarrito));
      }
      const historial = await this.#repositorio.historialDeEstados(correo, numCarrito, cliente);
      const estadoPrevio = historial.at(-1)?.estado;
      transicionar(estadoPrevio, estadoNuevo, estadoAnterior(historial));

      await this.#repositorio.registrarEstado(cliente, correo, numCarrito, estadoNuevo);
      if (estadoNuevo !== ESTADOS.CANCELADO) return { estadoPrevio, movimientos: [], credito: 0 };

      const movimientos = await this.#reponerInventario(cliente, correo, numCarrito, responsable);
      // Lo cobrado que todavía no se había acreditado queda a favor del cliente
      const credito = await this.#creditos.otorgar(cliente, {
        correo,
        numCarrito,
        monto: Number.POSITIVE_INFINITY,
        motivo: `Cancelación del pedido ${numCarrito}`,
      });
      return { estadoPrevio, movimientos, credito };
    });

    await this.#inventario.publicarMovimientos(movimientos, { responsable });
    const cambio = {
      correoUsuario: responsable,
      entidad: "pedido",
      entidadId: idDelPedido(correo, numCarrito),
      valorAnterior: { estado: estadoPrevio },
      valorNuevo: { estado: estadoNuevo },
    };
    await this.#busDeEventos.publicar(EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO, cambio);
    if (estadoNuevo === ESTADOS.CANCELADO) {
      const repuestas = movimientos.map(({ sku, cantidad }) => ({ sku, cantidad }));
      await this.#busDeEventos.publicar(EVENTOS.PEDIDO_CANCELADO, {
        ...cambio,
        valorNuevo: { estado: estadoNuevo, unidadesRepuestas: repuestas, creditoOtorgado: credito },
      });
    }
    return this.obtenerParaAdministracion(correo, numCarrito);
  }

  // Devuelve lo que salió por el pedido; lo que estaba en contrapedido nunca se descontó
  async #reponerInventario(cliente, correo, numCarrito, responsable) {
    const motivo = motivoDelPedido(correo, numCarrito);
    const unidades = await this.#inventario.unidadesQueSalieronEnTransaccion(cliente, motivo);
    await this.#inventario.bloquearEnTransaccion(cliente, [...unidades.keys()]);

    const movimientos = [];
    for (const [sku, cantidad] of unidades) {
      movimientos.push(
        await this.#inventario.registrarEnTransaccion(cliente, {
          sku,
          cantidad,
          tipo: "reposicion",
          correoAdministrador: responsable,
          motivo,
        })
      );
    }
    return movimientos;
  }

  // Si la facturación no está disponible el pedido sigue; la factura solo se guarda si se emitió
  async #facturar(cliente, { correo, numCarrito, numReferencia, lineas }) {
    const [emisor, receptor] = await Promise.all([
      this.#facturas.obtenerEmisor(cliente),
      this.#clientes.datosParaFactura(correo),
    ]);
    const resultado = await this.#facturacionElectronica.emitir({
      correoCliente: correo,
      numCarrito,
      numReferencia,
      emisor,
      receptor,
      lineas,
    });
    if (resultado.estado !== "emitida") return null;
    return this.#facturas.registrar(cliente, { numFactura: resultado.consecutivo, numReferencia });
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

// La vista suma el impuesto línea por línea sin redondear
function conMontos(pedido) {
  const subtotal = redondear(pedido.subtotal);
  const impuesto = redondear(pedido.impuesto);
  return { ...pedido, subtotal, impuesto, total: totalConEntrega({ subtotal, impuesto, costoEntrega: pedido.costoEntrega }) };
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
