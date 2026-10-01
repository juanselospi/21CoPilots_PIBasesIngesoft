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


/**
 * Catálogo público con precio final y disponibilidad (RF-10, RF-11).
 * Con ~195 SKU (RNF-02) filtrar y paginar en memoria es suficiente; si
 * el catálogo crece, la paginación baja al repositorio.
 */

 /** Ficha de producto (RF-12). */

 /** RN-03: si no es visible, para el público es como si no existiera. */

/**
 * Compone el producto con su precio calculado y su disponibilidad.
 * El precio nunca se lee de una columna: se calcula, para que un cambio
 * de margen o de impuesto se refleje sin recalcular tabla alguna (DD-13).
 */

/** RN-03 — un producto sin existencias que no admite contrapedido no se muestra. */

/** RF-07, RF-08, RN-03 — devolver los tres estados posibles. */

export class CatalogoService {
  #repositorio;
  #motorDePrecios;

  constructor({ repositorio, motorDePrecios }) {
    this.#repositorio = repositorio;
    this.#motorDePrecios = motorDePrecios;
  }

  async listarCatalogo({ categoria, termino, limite, desplazamiento }) {
    const productos = await this.#repositorio.listar({ categoria, termino });

    return productos
      .map((producto) => this.#conPrecioYDisponibilidad(producto))
      .filter(esVisible)
      .slice(desplazamiento, desplazamiento + limite);
  }

  async obtenerFicha(sku) {
    const producto = await this.#repositorio.obtenerPorSku(sku);
    const ficha = producto && this.#conPrecioYDisponibilidad(producto);

    if (!ficha || !esVisible(ficha)) {
      throw new RecursoNoEncontrado("el producto", sku);
    }

    return ficha;
  }

  async listarCategorias() {
    return this.#repositorio.listarCategorias();
  }

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

const esVisible = (producto) =>
  producto.disponibilidad !== DISPONIBILIDAD.NO_DISPONIBLE;

function determinarDisponibilidad(producto) {
  if (producto.existencias > 0) return DISPONIBILIDAD.EN_EXISTENCIA;
  if (producto.admiteContrapedido) return DISPONIBILIDAD.POR_CONTRAPEDIDO;
  return DISPONIBILIDAD.NO_DISPONIBLE;
}
