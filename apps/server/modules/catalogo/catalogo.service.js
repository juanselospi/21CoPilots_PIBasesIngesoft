/**
 * CAPA DE DOMINIO — Servicio del catálogo.
 *
 * Aquí viven las reglas; no sabe de Express ni de SQL. Recibe el
 * repositorio y el motor de precios por constructor, así que una prueba
 * puede pasarle un repositorio falso y verificar RN-03 sin base de datos.
 */

import {
  EntradaInvalida,
  ProductoConHistorial,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";
import { validarProductoNuevo } from "./validar-producto-nuevo.js";
import { validarCambiosDeProducto } from "./validar-cambios-de-producto.js";
import { conValoresDeLaFamilia } from "./herencia-de-familia.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { validarEstadoDeProducto } from "./validar-estado-de-producto.js";

/**
 * Estados de disponibilidad (RF-07). El visitante solo ve los dos primeros;
 * `descontinuado` solo aparece en el panel.
 */
export const DISPONIBILIDAD = Object.freeze({
  EN_EXISTENCIA: "en_existencia",
  POR_CONTRAPEDIDO: "por_contrapedido",
  NO_DISPONIBLE: "no_disponible",
  DESCONTINUADO: "descontinuado",
});

/** Estado del producto (RF-18): uno descontinuado sale de la tienda pero conserva su historial. */
export const ESTADOS_DE_PRODUCTO = Object.freeze({ ACTIVO: "activo", DESCONTINUADO: "descontinuado" });

/** Avisos que el panel dibuja junto al producto (RF-43). */
export const ETIQUETAS = Object.freeze({
  CONTRAPEDIDO: "contrapedido",
  MARGEN_NEGATIVO: "margen_negativo",
  EXISTENCIAS_BAJAS: "existencias_bajas",
  OCULTO_EN_TIENDA: "oculto_en_tienda",
  DESCONTINUADO: "descontinuado",
});

const UMBRAL_DE_EXISTENCIAS_BAJAS_POR_DEFECTO = 2;
const BUS_SIN_SUSCRIPTORES = { publicar: async () => {} };


/**
 * Catálogo público con precio final y disponibilidad.
 */

 /** Ficha de producto. */

 /** Si no es visible, para el público es como si no existiera. */

/**
 * Compone el producto con su precio calculado y su disponibilidad.
 */

/** Un producto sin existencias que no admite contrapedido no se muestra. */

/** Devolver los tres estados posibles. */

export class CatalogoService {
  #repositorio;
  #motorDePrecios;
  #umbralDeExistenciasBajas;
  #busDeEventos;
  #fijarExistencias;

  /**
   * `fijarExistencias` viene de inventario: el stock no se cambia sin dejar
   * el movimiento en el historial.
   */
  constructor({
    repositorio,
    motorDePrecios,
    umbralDeExistenciasBajas = UMBRAL_DE_EXISTENCIAS_BAJAS_POR_DEFECTO,
    busDeEventos = BUS_SIN_SUSCRIPTORES,
    fijarExistencias,
  }) {
    this.#repositorio = repositorio;
    this.#motorDePrecios = motorDePrecios;
    this.#umbralDeExistenciasBajas = umbralDeExistenciasBajas;
    this.#busDeEventos = busDeEventos;
    this.#fijarExistencias = fijarExistencias;
  }

  async listarCatalogo({ categoria, termino, limite, desplazamiento }) {
    const productos = await this.#repositorio.listar({ categoria, termino });

    return productos
      .map((producto) => this.#conPrecioYDisponibilidad(producto))
      .filter(esVisible)
      .slice(desplazamiento, desplazamiento + limite);
  }

  /**
   * Listado del panel con los productos ocultos en la tienda (RF-43). Los
   * descontinuados (RF-18) solo salen con el filtro `disponibilidad=descontinuado`.
   * @returns la página pedida y el total de productos que cumplen los filtros
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
      .filter((producto) =>
        disponibilidad === null
          ? producto.disponibilidad !== DISPONIBILIDAD.DESCONTINUADO
          : producto.disponibilidad === disponibilidad
      )
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
   * Familias de la tienda con su cantidad de productos visibles. Las
   * inactivas y las que solo tienen productos ocultos no aparecen.
   */
  async listarFamilias() {
    const productos = await this.#repositorio.listar();

    const cantidades = new Map();
    for (const { categoria } of productos.filter(esVisible)) {
      cantidades.set(categoria, (cantidades.get(categoria) ?? 0) + 1);
    }

    return [...cantidades]
      .map(([nombre, cantidadDeProductos]) => ({ nombre, cantidadDeProductos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  // La tienda todavía pide /categorias
  async listarCategorias() {
    return this.listarFamilias();
  }

  /**
   * Registra un producto nuevo desde el panel. 
   * @returns el producto guardado, con su precio calculado
   */
  async crearProducto(datos) {
    const producto = validarProductoNuevo(datos);

    const categoria = await this.#familiaExistente(producto.categoria);
    const sku = await this.#repositorio.crear({ ...producto, categoria });
    if (sku === null) {
      throw new ReglaDeNegocioViolada(`Ya existe un producto con el código ${producto.sku}.`, "RF-01");
    }

    return this.#conPrecioYDisponibilidad(await this.#repositorio.obtenerPorSku(sku));
  }

  /**
   * Cambia los datos generales, el precio, las existencias o el contrapedido
   * desde el modal "Editar producto" del panel. Un cambio de costo,
   * importación o margen se publica para la bitácora (RF-52).
   * @returns el producto actualizado, con su precio y disponibilidad recalculados
   */
  async actualizarProducto(sku, datos, { responsable = null } = {}) {
    const { existencias, ...cambios } = validarCambiosDeProducto(datos);

    const anterior = await this.#repositorio.obtenerPorSku(sku);
    if (!anterior) throw new RecursoNoEncontrado("el producto", sku);
    const precioAnterior = parametrosDePrecio(anterior);

    if (cambios.categoria !== undefined) cambios.categoria = await this.#familiaExistente(cambios.categoria);

    // Corregir las existencias deja un ajuste con motivo, como cualquier otro cambio de stock
    if (existencias !== undefined) await this.#fijarExistencias(sku, existencias, { responsable });

    if (Object.keys(cambios).length > 0) {
      const actualizado = await this.#repositorio.actualizar(sku, cambios);
      if (actualizado === null) throw new RecursoNoEncontrado("el producto", sku);
    }

    const producto = await this.#repositorio.obtenerPorSku(sku);
    const precioNuevo = parametrosDePrecio(producto);
    if (JSON.stringify(precioAnterior) !== JSON.stringify(precioNuevo)) {
      await this.#busDeEventos.publicar(EVENTOS.PARAMETRO_MODIFICADO, {
        correoUsuario: responsable,
        entidad: "producto",
        entidadId: sku,
        valorAnterior: precioAnterior,
        valorNuevo: precioNuevo,
      });
    }

    return this.#conPrecioYDisponibilidad(producto);
  }

  /**
   * RF-18: desactiva o reactiva un producto. Descontinuado sale de la tienda
   * pero sigue en el panel y en los reportes.
   * @returns el producto con su estado nuevo
   */
  async cambiarEstado(sku, datos, { responsable = null } = {}) {
    const estado = validarEstadoDeProducto(datos);

    const anterior = await this.#repositorio.obtenerPorSku(sku);
    if (!anterior) throw new RecursoNoEncontrado("el producto", sku);

    if (anterior.estado !== estado) {
      await this.#repositorio.actualizar(sku, { estado });
      await this.#busDeEventos.publicar(EVENTOS.ESTADO_DE_PRODUCTO_CAMBIADO, {
        correoUsuario: responsable,
        entidad: "producto",
        entidadId: sku,
        valorAnterior: { estado: anterior.estado },
        valorNuevo: { estado },
      });
    }

    return this.#conPrecioYDisponibilidad(await this.#repositorio.obtenerPorSku(sku));
  }

  /**
   * Borra un producto que nunca se vendió ni tuvo movimientos. Si tiene
   * historial hay que desactivarlo, para no perder los reportes.
   */
  async eliminarProducto(sku, { responsable = null } = {}) {
    const producto = await this.#repositorio.obtenerPorSku(sku);
    if (!producto) throw new RecursoNoEncontrado("el producto", sku);

    const resultado = await this.#repositorio.eliminar(sku);
    if (resultado === "no_existe") throw new RecursoNoEncontrado("el producto", sku);
    if (resultado === "con_historial") throw new ProductoConHistorial();

    await this.#busDeEventos.publicar(EVENTOS.PRODUCTO_ELIMINADO, {
      correoUsuario: responsable,
      entidad: "producto",
      entidadId: sku,
      valorAnterior: { nombre: producto.nombre, categoria: producto.categoria, costoItem: producto.costoItem },
      valorNuevo: null,
    });
  }

  /**
   * Lo que pedidos necesita de cada producto para el carrito y la compra:
   * el precio con y sin impuesto del motor de precios, las existencias y si
   * está a la venta (activo, de una familia activa y disponible, RN-03).
   * @returns un Map por SKU; los que no existen no aparecen
   */
  async productosParaVenta(skus) {
    const productos = await this.#repositorio.obtenerVarios([...new Set(skus)]);
    return new Map(
      productos.map((guardado) => {
        const producto = this.#conPrecioYDisponibilidad(guardado);
        const precioSinImpuesto = producto.desglosePrecio.find(({ paso }) => paso === "margen")?.monto ?? 0;
        return [
          producto.sku,
          {
            sku: producto.sku,
            nombre: producto.nombre,
            imagenUrl: producto.imagenUrl,
            precioFinal: producto.precioFinal,
            precioSinImpuesto,
            tasaImpuesto: producto.tasaImpuesto,
            existencias: producto.existencias,
            admiteContrapedido: producto.admiteContrapedido,
            aLaVenta: esVisible(producto),
          },
        ];
      })
    );
  }

  // Devuelve el nombre como está guardado, así "legos" entra en "Legos"
  async #familiaExistente(nombre) {
    const familia = await this.#repositorio.buscarFamilia(nombre);
    if (!familia) throw new EntradaInvalida(`No existe la familia ${nombre}. Créela primero.`, ["categoria"]);
    return familia.nombre;
  }

  #conPrecioYDisponibilidad(guardado) {
    const producto = conValoresDeLaFamilia(guardado);
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

// Los valores propios del producto, null si usa los de la familia
const parametrosDePrecio = ({ costoItem, porcentajeImportacion, margenGanancia }) => ({
  costoItem,
  porcentajeImportacion: porcentajeImportacion ?? null,
  margenGanancia: margenGanancia ?? null,
});

// Sirve para el producto tal como sale del repositorio o ya compuesto.
// Desactivar una familia saca todos sus productos de la tienda.
const esVisible = (producto) => {
  const disponibilidad = determinarDisponibilidad(producto);
  return (
    producto.familia?.activa !== false &&
    disponibilidad !== DISPONIBILIDAD.NO_DISPONIBLE &&
    disponibilidad !== DISPONIBILIDAD.DESCONTINUADO
  );
};

const porSku = (a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0);
const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
const porPrecio = (a, b) => a.precioFinal - b.precioFinal;
const invertido = (comparar) => (a, b) => comparar(b, a);

/** Órdenes del panel; los empates van por SKU para no repetir productos al paginar. */
export const ORDENES_DE_ADMINISTRACION = Object.freeze({
  nombre: porNombre,
  "-nombre": invertido(porNombre),
  precio: porPrecio,
  "-precio": invertido(porPrecio),
  existencias: (a, b) => a.existencias - b.existencias,
  sku: porSku,
});

/** Etiquetas del producto ya compuesto, en orden fijo y solo las que aplican. */
export function calcularEtiquetas(producto, umbralDeExistenciasBajas) {
  const etiquetas = [];

  if (producto.admiteContrapedido) etiquetas.push(ETIQUETAS.CONTRAPEDIDO);
  if (producto.margenGanancia < 0) etiquetas.push(ETIQUETAS.MARGEN_NEGATIVO);
  const descontinuado = producto.disponibilidad === DISPONIBILIDAD.DESCONTINUADO;
  // Igual que la alerta de inventario: uno descontinuado no se va a reponer, así que no avisa
  if (!descontinuado && producto.existencias <= umbralDeExistenciasBajas) etiquetas.push(ETIQUETAS.EXISTENCIAS_BAJAS);
  const oculto =
    producto.disponibilidad === DISPONIBILIDAD.NO_DISPONIBLE || descontinuado || producto.familia?.activa === false;
  if (oculto) etiquetas.push(ETIQUETAS.OCULTO_EN_TIENDA);
  if (descontinuado) etiquetas.push(ETIQUETAS.DESCONTINUADO);

  return etiquetas;
}

function determinarDisponibilidad(producto) {
  if (producto.estado === ESTADOS_DE_PRODUCTO.DESCONTINUADO) return DISPONIBILIDAD.DESCONTINUADO;
  if (producto.existencias > 0) return DISPONIBILIDAD.EN_EXISTENCIA;
  if (producto.admiteContrapedido) return DISPONIBILIDAD.POR_CONTRAPEDIDO;
  return DISPONIBILIDAD.NO_DISPONIBLE;
}
