/**
 * CAPA DE DOMINIO — Servicio del catálogo.
 *
 * Aquí viven las reglas; no sabe de Express ni de SQL. Recibe el
 * repositorio y el motor de precios por constructor, así que una prueba
 * puede pasarle un repositorio falso y verificar RN-03 sin base de datos.
 */

import {
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";
import { validarProductoNuevo } from "./validar-producto-nuevo.js";

/** Estados de disponibilidad que ve el visitante (RF-07). */
export const DISPONIBILIDAD = Object.freeze({
  EN_EXISTENCIA: "en_existencia",
  POR_CONTRAPEDIDO: "por_contrapedido",
  NO_DISPONIBLE: "no_disponible",
});

/** Avisos que el panel dibuja junto al producto (RF-43). */
export const ETIQUETAS = Object.freeze({
  CONTRAPEDIDO: "contrapedido",
  MARGEN_NEGATIVO: "margen_negativo",
  EXISTENCIAS_BAJAS: "existencias_bajas",
  OCULTO_EN_TIENDA: "oculto_en_tienda",
});

const UMBRAL_DE_EXISTENCIAS_BAJAS_POR_DEFECTO = 2;


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
  #umbralDeExistenciasBajas;

  constructor({
    repositorio,
    motorDePrecios,
    umbralDeExistenciasBajas = UMBRAL_DE_EXISTENCIAS_BAJAS_POR_DEFECTO,
  }) {
    this.#repositorio = repositorio;
    this.#motorDePrecios = motorDePrecios;
    this.#umbralDeExistenciasBajas = umbralDeExistenciasBajas;
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

  /**
   * Registra un producto nuevo desde el panel. El código tiene que ser
   * único: si ya existe, no se guarda nada (RF-01). Nace con stock en 0.
   *
   * @returns el producto guardado, con su precio calculado
   */
  async crearProducto(datos) {
    const producto = validarProductoNuevo(datos);

    const sku = await this.#repositorio.crear(producto);
    if (sku === null) {
      throw new ReglaDeNegocioViolada(`Ya existe un producto con el código ${producto.sku}.`, "RF-01");
    }

    return this.#conPrecioYDisponibilidad(await this.#repositorio.obtenerPorSku(sku));
  }

  #conPrecioYDisponibilidad(producto) {
    const { precioFinal, desglose } = this.#motorDePrecios.calcular(producto);
    const disponibilidad = determinarDisponibilidad(producto);

    return {
      ...producto,
      precioFinal,
      desglosePrecio: desglose,
      disponibilidad,
      etiquetas: calcularEtiquetas({ ...producto, disponibilidad }, this.#umbralDeExistenciasBajas),
    };
  }
}

const esVisible = (producto) =>
  producto.disponibilidad !== DISPONIBILIDAD.NO_DISPONIBLE;

/**
 * Etiquetas del producto ya compuesto (con su disponibilidad). Salen
 * siempre en este orden y solo las que aplican. Las calcula el servidor
 * porque dependen de reglas de negocio; el panel solo las dibuja.
 */
export function calcularEtiquetas(producto, umbralDeExistenciasBajas) {
  const etiquetas = [];

  if (producto.admiteContrapedido) etiquetas.push(ETIQUETAS.CONTRAPEDIDO);
  if (producto.margenGanancia < 0) etiquetas.push(ETIQUETAS.MARGEN_NEGATIVO);
  if (producto.existencias <= umbralDeExistenciasBajas) etiquetas.push(ETIQUETAS.EXISTENCIAS_BAJAS);
  if (producto.disponibilidad === DISPONIBILIDAD.NO_DISPONIBLE) etiquetas.push(ETIQUETAS.OCULTO_EN_TIENDA);

  return etiquetas;
}

function determinarDisponibilidad(producto) {
  if (producto.existencias > 0) return DISPONIBILIDAD.EN_EXISTENCIA;
  if (producto.admiteContrapedido) return DISPONIBILIDAD.POR_CONTRAPEDIDO;
  return DISPONIBILIDAD.NO_DISPONIBLE;
}
