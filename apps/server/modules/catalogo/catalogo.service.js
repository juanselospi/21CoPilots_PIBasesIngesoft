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
import { validarCambiosDePrecio } from "./validar-cambios-de-precio.js";

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

  /**
   * Listado del panel (RF-43): todos los productos, también los que RN-03
   * oculta en la tienda. Los filtros por precio y disponibilidad y el
   * orden van en memoria por la misma razón que en `listarCatalogo`: el
   * precio se calcula, no se guarda.
   *
   * @returns la página pedida y el total de productos que cumplen los
   *          filtros, antes de paginar
   */
  async listarParaAdministracion({
    termino = null,
    categoria = null,
    proveedor = null,
    disponibilidad = null,
    existenciasBajas = false,
    margenNegativo = false,
    precioMin = null,
    precioMax = null,
    orden = "nombre",
    limite,
    desplazamiento = 0,
  }) {
    const productos = await this.#repositorio.listarParaAdministracion({ termino, categoria, proveedor });

    const filtrados = productos
      .map((producto) => this.#conPrecioYDisponibilidad(producto))
      .filter((producto) => disponibilidad === null || producto.disponibilidad === disponibilidad)
      .filter((producto) => !existenciasBajas || producto.etiquetas.includes(ETIQUETAS.EXISTENCIAS_BAJAS))
      .filter((producto) => !margenNegativo || producto.etiquetas.includes(ETIQUETAS.MARGEN_NEGATIVO))
      .filter((producto) => precioMin === null || producto.precioFinal >= precioMin)
      .filter((producto) => precioMax === null || producto.precioFinal <= precioMax)
      .sort((a, b) => ORDENES_DE_ADMINISTRACION[orden](a, b) || porSku(a, b));

    return {
      productos: filtrados.slice(desplazamiento, desplazamiento + limite),
      total: filtrados.length,
    };
  }

  async obtenerFicha(sku) {
    const producto = await this.#repositorio.obtenerPorSku(sku);
    const ficha = producto && this.#conPrecioYDisponibilidad(producto);

    if (!ficha || !esVisible(ficha)) {
      throw new RecursoNoEncontrado("el producto", sku);
    }

    return ficha;
  }

  /**
   * Categorías con la cantidad de productos que ve el público. Solo se
   * cuentan los visibles, así una categoría con todos sus productos
   * ocultos no aparece en la tienda (RN-03).
   */
  async listarCategorias() {
    const productos = await this.#repositorio.listar();

    const cantidades = new Map();
    for (const { categoria } of productos.filter(esVisible)) {
      cantidades.set(categoria, (cantidades.get(categoria) ?? 0) + 1);
    }

    return [...cantidades]
      .map(([nombre, cantidadDeProductos]) => ({ nombre, cantidadDeProductos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
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

  /**
   * Cambia el costo, la importación o el margen de un producto desde el
   * modal "Editar precio" del panel (RF-01). Lo que no venga se queda como
   * está. El precio no se guarda: se vuelve a calcular con el motor de
   * precios (RF-03, RF-04, RF-05), y el margen puede ser negativo pero
   * mayor que -100 % (RN-02).
   *
   * Se busca con `obtenerPorSku` y no con `obtenerFicha`, porque el
   * administrador también edita los productos que RN-03 oculta en la tienda.
   *
   * No cambia el historial: las líneas de carritos y pedidos
   * (`pedidos.agrega`) guardan su propio precio unitario y tasa de
   * impuesto, así que el precio nuevo solo afecta lo que se agregue desde
   * ahora.
   *
   * @returns el producto actualizado, con su precio recalculado
   */
  async actualizarPrecio(sku, datos) {
    const cambios = validarCambiosDePrecio(datos);

    const actualizado = await this.#repositorio.actualizarPrecio(sku, cambios);
    if (actualizado === null) {
      throw new RecursoNoEncontrado("el producto", sku);
    }

    return this.#conPrecioYDisponibilidad(await this.#repositorio.obtenerPorSku(actualizado));
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

// Sirve para el producto tal como sale del repositorio o ya compuesto
const esVisible = (producto) =>
  determinarDisponibilidad(producto) !== DISPONIBILIDAD.NO_DISPONIBLE;

const porSku = (a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0);
const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
const porPrecio = (a, b) => a.precioFinal - b.precioFinal;
const invertido = (comparar) => (a, b) => comparar(b, a);

/**
 * Valores de `orden` del listado del panel; el `-` invierte. Los
 * empates se resuelven siempre por SKU, para que la paginación no
 * repita ni salte productos.
 */
export const ORDENES_DE_ADMINISTRACION = Object.freeze({
  nombre: porNombre,
  "-nombre": invertido(porNombre),
  precio: porPrecio,
  "-precio": invertido(porPrecio),
  existencias: (a, b) => a.existencias - b.existencias,
  sku: porSku,
});

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
