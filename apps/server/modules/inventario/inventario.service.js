/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
 *
 * El stock vive en `catalogo.producto.stock` y cada cambio deja una fila
 * en `inventario.producto_administra`. Los productos se identifican por
 * `sku`, también en los eventos.
 *
 * POR IMPLEMENTAR
 *   RF-15  Registrar movimiento por cualquiera de sus orígenes
 *   RF-19  Consultar el historial de movimientos
 *   RF-20  Rechazar ajustes sin justificación
 *
 * Pedidos descuenta y repone stock a través de este servicio, también en
 * las ventas de otros canales (RF-17).
 */

import { RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { validarIngreso } from "./validar-ingreso.js";

/** Tipos de movimiento que admite inventario.producto_administra. */
export const TIPOS_DE_MOVIMIENTO = Object.freeze({
  INGRESO: "ingreso",
  AJUSTE: "ajuste",
  VENTA_EXTERNA: "venta_externa",
  VENTA_EN_LINEA: "venta_en_linea",
  REPOSICION: "reposicion",
});

export class InventarioService {
  #repositorio;
  #busDeEventos;
  #umbralDeExistenciasBajas;

  constructor({ repositorio, busDeEventos, umbralDeExistenciasBajas = 2 }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#umbralDeExistenciasBajas = umbralDeExistenciasBajas;
  }

  /**
   * RF-16: productos activos en el umbral o por debajo (RN-04). Se calcula del stock
   * en cada consulta, así que un ingreso que lo sube saca al producto solo.
   */
  async listarAlertas() {
    const umbral = this.#umbralDeExistenciasBajas;
    const productos = await this.#repositorio.listarExistenciasBajas(umbral);
    return { umbral, productos };
  }

  /**
   * RF-13, RF-14: entra mercancía. Sube el stock, el costo de esta compra
   * pasa a ser el del producto y el movimiento queda con su costo, todo en
   * una transacción con el producto bloqueado.
   */
  async registrarIngreso(datos, { responsable }) {
    const { sku, cantidad, costoUnitario } = validarIngreso(datos);

    const movimiento = await this.#repositorio.enTransaccion(async (cliente) => {
      const productos = await this.#repositorio.bloquearProductos(cliente, [sku]);
      if (!productos.has(sku)) throw new RecursoNoEncontrado("el producto", sku);

      await this.#repositorio.actualizarCosto(cliente, sku, costoUnitario);
      return this.#repositorio.registrarMovimiento(cliente, {
        sku,
        cantidad,
        tipo: TIPOS_DE_MOVIMIENTO.INGRESO,
        correoAdministrador: responsable,
        costoUnitario,
      });
    });

    // Se publica después de confirmar, para no avisar de algo que se revirtió
    await this.#busDeEventos.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, { correoUsuario: responsable, ...movimiento });
    return movimiento;
  }
}
