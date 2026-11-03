/**
 * CAPA DE DOMINIO — Inventario. NÚCLEO DEL SISTEMA.
 *
 * El stock vive en `catalogo.producto.stock` y cada cambio deja una fila
 * en `inventario.producto_administra`. Los productos se identifican por
 * `sku`, también en los eventos.
 *
 * POR IMPLEMENTAR
 *   RF-15  Registrar movimiento por cualquiera de sus orígenes
 *
 * Pedidos descuenta y repone stock a través de este servicio, también en
 * las ventas de otros canales (RF-17).
 */

import { RecursoNoEncontrado, ReglaDeNegocioViolada } from "../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { validarIngreso } from "./validar-ingreso.js";
import { validarAjuste } from "./validar-ajuste.js";
import { validarConsultaDeMovimientos } from "./validar-consulta-de-movimientos.js";

// Así queda el movimiento cuando las existencias se corrigen en el modal "Editar producto"
export const MOTIVO_DE_CORRECCION_DESDE_EL_PANEL = "Corrección desde el panel";

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

  /** RF-20: suma o resta unidades con un motivo; nunca deja el stock en negativo. */
  async registrarAjuste(datos, { responsable }) {
    const { sku, cantidad, motivo } = validarAjuste(datos);
    return this.#ajustar(sku, () => cantidad, { responsable, motivo });
  }

  /**
   * Deja las existencias en un número exacto registrando la diferencia como
   * ajuste, para que ningún cambio de stock quede sin historial. La usa el
   * modal "Editar producto".
   * @returns el movimiento, o null si ya tenía esas existencias
   */
  async fijarExistencias(sku, existencias, { responsable, motivo = MOTIVO_DE_CORRECCION_DESDE_EL_PANEL }) {
    return this.#ajustar(sku, (stock) => existencias - stock, { responsable, motivo });
  }

  /**
   * Para pedidos, dentro de su propia transacción: bloquea los productos en
   * orden de SKU y devuelve su stock.
   */
  async bloquearEnTransaccion(cliente, skus) {
    return this.#repositorio.bloquearProductos(cliente, skus);
  }

  /**
   * Para pedidos, dentro de su propia transacción. No publica nada: quien
   * llama publica los movimientos después de confirmar.
   */
  async registrarEnTransaccion(cliente, movimiento) {
    return this.#repositorio.registrarMovimiento(cliente, movimiento);
  }

  /** Avisa de movimientos ya confirmados por otra transacción, para la alerta y la bitácora. */
  async publicarMovimientos(movimientos, { responsable = null } = {}) {
    for (const movimiento of movimientos) {
      await this.#busDeEventos.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, { correoUsuario: responsable, ...movimiento });
    }
  }

  /** RF-19: el historial con su total para paginar. */
  async listarMovimientos(consulta) {
    const filtros = validarConsultaDeMovimientos(consulta);
    const { movimientos, total } = await this.#repositorio.listarMovimientos(filtros);
    return { movimientos, total, pagina: filtros.pagina, limite: filtros.limite };
  }

  // La cantidad se calcula con el stock ya bloqueado, así nadie lo cambia en medio
  async #ajustar(sku, calcularCantidad, { responsable, motivo }) {
    const movimiento = await this.#repositorio.enTransaccion(async (cliente) => {
      const productos = await this.#repositorio.bloquearProductos(cliente, [sku]);
      const producto = productos.get(sku);
      if (!producto) throw new RecursoNoEncontrado("el producto", sku);

      const cantidad = calcularCantidad(producto.stock);
      if (cantidad === 0) return null;
      if (producto.stock + cantidad < 0) {
        throw new ReglaDeNegocioViolada(
          `Solo hay ${producto.stock} unidades de ${sku}; no se pueden restar ${-cantidad}.`,
          "RF-20"
        );
      }

      return this.#repositorio.registrarMovimiento(cliente, {
        sku,
        cantidad,
        tipo: TIPOS_DE_MOVIMIENTO.AJUSTE,
        correoAdministrador: responsable,
        motivo,
      });
    });

    if (movimiento) {
      await this.#busDeEventos.publicar(EVENTOS.MOVIMIENTO_REGISTRADO, { correoUsuario: responsable, ...movimiento });
    }
    return movimiento;
  }
}
