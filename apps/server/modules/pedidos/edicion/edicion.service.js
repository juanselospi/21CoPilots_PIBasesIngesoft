/**
 * CAPA DE DOMINIO: El administrador cambia las líneas de un pedido.
 *
 * Cada cambio es una transacción: bloquea el pedido y después los
 * productos, mueve el inventario por la diferencia y guarda la línea. Las
 * líneas conservan el precio que se pagó; una línea nueva entra con el
 * precio de hoy.
 *
 * Solo se mueven las unidades que de verdad salieron: si una línea tenía
 * contrapedido, al reducirla primero se descuenta lo que faltaba por llegar.
 *
 * Si el pedido ya estaba pagado, lo que se quita queda como crédito a favor
 * del cliente: nunca se devuelve dinero.
 */

import {
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
  SinExistencias,
} from "../../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";
import { TIPOS_DE_MOVIMIENTO } from "../../inventario/inventario.service.js";
import { admiteEdicion } from "../estados/maquina-de-estados.js";
import { validarCantidad, validarLinea } from "../carrito/validar-linea.js";
import { validarReemplazo } from "./validar-reemplazo.js";
import { idDelPedido, motivoDelPedido } from "../referencia-del-pedido.js";

export class EdicionDePedidosService {
  #repositorio;
  #inventario;
  #productosParaVenta;
  #busDeEventos;
  #creditos;

  constructor({ repositorio, inventario, productosParaVenta, busDeEventos, creditos }) {
    this.#repositorio = repositorio;
    this.#inventario = inventario;
    this.#productosParaVenta = productosParaVenta;
    this.#busDeEventos = busDeEventos;
    this.#creditos = creditos;
  }

  /** PATCH: cambia la cantidad; sube o baja el inventario por la diferencia. */
  async cambiarCantidad(correo, numCarrito, sku, datos, { responsable }) {
    const cantidad = validarCantidad(datos);

    return this.#editar(correo, numCarrito, responsable, [sku], async (pedido) => {
      const linea = pedido.linea(sku);
      if (cantidad < linea.cantidad) {
        // Lo que estaba en contrapedido se quita primero
        await pedido.devolver(sku, Math.max(0, pedido.salieron(sku) - cantidad));
      } else {
        await pedido.sacar(sku, cantidad - linea.cantidad);
      }
      const nueva = { ...linea, cantidad };
      await pedido.guardar(nueva);
      const credito = cantidad < linea.cantidad ? await pedido.acreditarLoQuitado(linea, linea.cantidad - cantidad) : 0;
      return { anterior: linea, nueva, credito };
    });
  }

  /** DELETE: quita la línea y devuelve lo que salió. */
  async quitarLinea(correo, numCarrito, sku, { responsable }) {
    return this.#editar(correo, numCarrito, responsable, [sku], async (pedido) => {
      const linea = pedido.linea(sku);
      if (pedido.lineas.size === 1) {
        throw new ReglaDeNegocioViolada("El pedido no puede quedar sin productos; cancélelo en su lugar.", "RF-28");
      }
      await pedido.devolver(sku, pedido.salieron(sku));
      await pedido.quitar(sku);
      const credito = await pedido.acreditarLoQuitado(linea, linea.cantidad);
      return { anterior: linea, nueva: null, credito };
    });
  }

  /** POST: agrega un producto que no estaba, con el precio de hoy. */
  async agregarLinea(correo, numCarrito, datos, { responsable }) {
    const { sku, cantidad } = validarLinea(datos);

    return this.#editar(correo, numCarrito, responsable, [sku], async (pedido) => {
      if (pedido.lineas.has(sku)) {
        throw new ReglaDeNegocioViolada("Ese producto ya está en el pedido; cambie su cantidad.", "RF-26");
      }
      const producto = await pedido.productoALaVenta(sku);
      await pedido.sacar(sku, cantidad);
      const nueva = { sku, cantidad, precioUnitario: producto.precioSinImpuesto, tasaImpuesto: producto.tasaImpuesto };
      await pedido.guardar(nueva);
      return { anterior: null, nueva };
    });
  }

  /**
   * POST reemplazo: cambia un producto por otro de igual o menor precio. La
   * línea nueva conserva el precio pagado, así que no se cobra ni se devuelve
   * diferencia.
   */
  async reemplazarLinea(correo, numCarrito, sku, datos, { responsable }) {
    const skuNuevo = validarReemplazo(datos, sku);

    return this.#editar(correo, numCarrito, responsable, [sku, skuNuevo], async (pedido) => {
      const linea = pedido.linea(sku);
      if (pedido.lineas.has(skuNuevo)) {
        throw new ReglaDeNegocioViolada("El producto nuevo ya está en el pedido; cambie su cantidad.", "RF-26");
      }
      const producto = await pedido.productoALaVenta(skuNuevo);
      // Los dos con la misma cuenta, para que el redondeo no rechace uno del mismo precio
      const pagado = precioConImpuesto(linea);
      const precioNuevo = precioConImpuesto({ precioUnitario: producto.precioSinImpuesto, tasaImpuesto: producto.tasaImpuesto });
      if (precioNuevo > pagado) {
        throw new ReglaDeNegocioViolada(
          `Solo se puede cambiar por un producto de igual o menor precio (se pagó ${pagado} por unidad).`,
          "RF-26"
        );
      }

      await pedido.devolver(sku, pedido.salieron(sku));
      await pedido.quitar(sku);
      await pedido.sacar(skuNuevo, linea.cantidad);
      const nueva = { ...linea, sku: skuNuevo };
      await pedido.guardar(nueva);
      return { anterior: linea, nueva };
    });
  }

  async #editar(correo, numCarrito, responsable, skus, cambio) {
    const motivo = motivoDelPedido(correo, numCarrito);

    const { anterior, nueva, credito = 0, movimientos } = await this.#repositorio.enTransaccion(async (cliente) => {
      const bloqueado = await this.#repositorio.bloquearPedido(cliente, correo, numCarrito);
      if (!bloqueado) throw new RecursoNoEncontrado("el pedido", idDelPedido(correo, numCarrito));

      const historial = await this.#repositorio.historialDeEstados(correo, numCarrito, cliente);
      const estado = historial.at(-1)?.estado;
      if (!admiteEdicion(estado)) {
        throw new ReglaDeNegocioViolada(`Un pedido en estado "${estado}" ya no se puede editar.`, "RF-26");
      }

      const lineas = new Map(
        (await this.#repositorio.lineasDelPedido(correo, numCarrito, cliente)).map((linea) => [linea.sku, linea])
      );
      const salieron = await this.#inventario.unidadesQueSalieronEnTransaccion(cliente, motivo);
      const stock = await this.#inventario.bloquearEnTransaccion(cliente, skus);
      // Las ventas por otro canal se registran como venta externa, igual que al crearlas
      const tipoDeSalida =
        bloqueado.canal === "web" ? TIPOS_DE_MOVIMIENTO.VENTA_EN_LINEA : TIPOS_DE_MOVIMIENTO.VENTA_EXTERNA;
      const movimientos = [];
      const mover = async (sku, cantidad, tipo) => {
        movimientos.push(
          await this.#inventario.registrarEnTransaccion(cliente, {
            sku,
            cantidad,
            tipo,
            correoAdministrador: responsable,
            motivo,
          })
        );
      };

      const pedido = {
        lineas,
        linea: (sku) => {
          if (!lineas.has(sku)) throw new RecursoNoEncontrado("en el pedido el producto", sku);
          return lineas.get(sku);
        },
        salieron: (sku) => salieron.get(sku) ?? 0,
        productoALaVenta: async (sku) => {
          const producto = (await this.#productosParaVenta([sku])).get(sku);
          if (!producto) throw new RecursoNoEncontrado("el producto", sku);
          if (!producto.aLaVenta) {
            throw new ReglaDeNegocioViolada("Ese producto ya no está a la venta.", "RF-18");
          }
          return producto;
        },
        devolver: async (sku, unidades) => {
          if (unidades > 0) await mover(sku, unidades, TIPOS_DE_MOVIMIENTO.REPOSICION);
        },
        // Sin existencias suficientes solo pasa si el producto admite contrapedido
        sacar: async (sku, unidades) => {
          if (unidades <= 0) return;
          const { stock: disponibles = 0, contrapedido = false } = stock.get(sku) ?? {};
          if (!contrapedido && unidades > Number(disponibles)) {
            throw new SinExistencias(
              [{ sku, solicitadas: unidades, disponibles: Number(disponibles) }],
              `No hay suficientes existencias de ${sku}: faltan ${unidades} y hay ${disponibles}.`
            );
          }
          const salen = Math.min(unidades, Number(disponibles));
          if (salen > 0) await mover(sku, -salen, tipoDeSalida);
        },
        acreditarLoQuitado: async (linea, unidades) => {
          // Se mira como quedo el pedido, lo que sigue ahi ya esta cubierto con lo que pago el cliente.
          // Por eso una linea que se agrego despues y nunca se cobro no deja credito al quitarla
          const quedan = await this.#repositorio.lineasDelPedido(correo, numCarrito, cliente);
          const costoEntrega = await this.#repositorio.costoDeEntrega(correo, numCarrito, cliente);
          return this.#creditos.otorgar(cliente, {
            correo,
            numCarrito,
            monto: precioConImpuesto(linea) * unidades,
            motivo: `${unidades === 1 ? "Se quitó" : "Se quitaron"} ${unidades} de ${linea.sku} del pedido ${numCarrito}`,
            valorQueSigue: valorDelPedido(quedan, costoEntrega),
          });
        },
        guardar: (linea) => this.#repositorio.guardarLinea(correo, numCarrito, linea, cliente),
        quitar: (sku) => this.#repositorio.quitarLinea(correo, numCarrito, sku, cliente),
      };

      return { ...(await cambio(pedido)), movimientos };
    });

    await this.#inventario.publicarMovimientos(movimientos, { responsable });
    await this.#busDeEventos.publicar(EVENTOS.PEDIDO_MODIFICADO, {
      correoUsuario: responsable,
      entidad: "pedido",
      entidadId: idDelPedido(correo, numCarrito),
      valorAnterior: anterior && aValorDeBitacora(anterior),
      valorNuevo: valorNuevoDeBitacora(nueva, credito),
    });
    return { anterior, nueva, credito, movimientos };
  }
}

const aValorDeBitacora = ({ sku, cantidad, precioUnitario }) => ({ sku, cantidad, precioUnitario });

// Una línea quitada no tiene valor nuevo, pero el crédito sí se anota
function valorNuevoDeBitacora(nueva, credito) {
  const valor = nueva ? aValorDeBitacora(nueva) : null;
  if (credito <= 0) return valor;
  return { ...valor, creditoOtorgado: credito };
}

// Lo que vale el pedido con envio, con la misma cuenta del total al comprar
const valorDelPedido = (lineas, costoEntrega) =>
  redondear(lineas.reduce((suma, linea) => suma + redondear(precioConImpuesto(linea) * linea.cantidad), 0) + costoEntrega);

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;

// Lo que el cliente pagó por unidad, con impuesto
const precioConImpuesto = ({ precioUnitario, tasaImpuesto }) =>
  Math.round((precioUnitario * (1 + tasaImpuesto / 100) + Number.EPSILON) * 100) / 100;
