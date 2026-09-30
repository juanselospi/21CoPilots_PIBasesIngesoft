/**
 * CAPA DE DOMINIO — Servicio del catálogo.
 *
 * Aquí viven las reglas; no sabe de Express ni de SQL. Recibe el
 * repositorio y el motor de precios por constructor, así que una prueba
 * puede pasarle un repositorio falso y verificar RN-03 sin base de datos.
 */

import { RecursoNoEncontrado } from "../../shared/errores/errores-de-dominio.js";

/** Estados de disponibilidad que ve el visitante (RF-07). */
export const DISPONIBILIDAD = Object.freeze({
  EN_EXISTENCIA: "en_existencia",
  POR_CONTRAPEDIDO: "por_contrapedido",
  NO_DISPONIBLE: "no_disponible",
});

export class CatalogoService {
  #repositorio;
  #motorDePrecios;

  constructor({ repositorio, motorDePrecios }) {
    this.#repositorio = repositorio;
    this.#motorDePrecios = motorDePrecios;
  }

  /**
   * Catálogo público con precio final y disponibilidad (RF-10, RF-11).
   * Con ~195 SKU (RNF-02) filtrar y paginar en memoria es suficiente; si
   * el catálogo crece, la paginación baja al repositorio.
   */
  async listarCatalogo({ categoria, termino, limite, desplazamiento }) {
    const productos = await this.#repositorio.listar({ categoria, termino });

    return productos
      .map((producto) => this.#conPrecioYDisponibilidad(producto))
      .filter(esVisible)
      .slice(desplazamiento, desplazamiento + limite);
  }

  /** Ficha de producto (RF-12). */
  async obtenerFicha(sku) {
    const producto = await this.#repositorio.obtenerPorSku(sku);
    const ficha = producto && this.#conPrecioYDisponibilidad(producto);

    // RN-03: si no es visible, para el público es como si no existiera.
    if (!ficha || !esVisible(ficha)) {
      throw new RecursoNoEncontrado("el producto", sku);
    }

    return ficha;
  }

  /**
   * Categorías con cuántos productos visibles tiene cada una (RF-10). En el
   * EER la categoría es un atributo del producto, así que se arman a partir
   * de los productos; el conteo usa la misma regla de visibilidad (RN-03).
   */
  async listarCategorias() {
    const productos = await this.#repositorio.listar();
    const conteo = new Map();

    for (const producto of productos.map((p) => this.#conPrecioYDisponibilidad(p))) {
      const visibles = conteo.get(producto.categoria) ?? 0;
      conteo.set(producto.categoria, visibles + (esVisible(producto) ? 1 : 0));
    }

    return [...conteo]
      .map(([nombre, cantidadDeProductos]) => ({ nombre, cantidadDeProductos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  /**
   * Compone el producto con su precio calculado y su disponibilidad.
   * El precio nunca se lee de una columna: se calcula, para que un cambio
   * de margen o de impuesto se refleje sin recalcular tabla alguna (DD-13).
   */
  #conPrecioYDisponibilidad(producto) {
    const { precioFinal, desglose } = this.#motorDePrecios.calcular(producto);

    return {
      ...producto,
      precioFinal,
      desglosePrecio: desglose,
      disponibilidad: determinarDisponibilidad(producto),
    };
  }
}

/** RN-03 — un producto sin existencias que no admite contrapedido no se muestra. */
const esVisible = (producto) =>
  producto.disponibilidad !== DISPONIBILIDAD.NO_DISPONIBLE;

/**
 * RF-07, RF-08, RN-03 — los tres estados posibles.
 * RF-18 (descontinuar) queda pendiente: el EER no tiene un estado del
 * producto. Mientras tanto, un producto sin stock y sin contrapedido ya
 * queda oculto por RN-03.
 */
function determinarDisponibilidad(producto) {
  if (producto.existencias > 0) return DISPONIBILIDAD.EN_EXISTENCIA;
  if (producto.admiteContrapedido) return DISPONIBILIDAD.POR_CONTRAPEDIDO;
  return DISPONIBILIDAD.NO_DISPONIBLE;
}
