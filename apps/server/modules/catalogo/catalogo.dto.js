/**
 * DTO del catálogo.
 *
 * Traduce el objeto de dominio a lo que sale por la API. No es
 * formalidad: el producto de dominio carga **costo, porcentaje de
 * importación y margen**, que son datos internos del negocio. Publicarlos
 * en el catálogo le regalaría al visitante la estructura de costos del
 * cliente.
 *
 * La lista blanca de abajo es la que garantiza que eso no pase, aunque
 * mañana alguien agregue una columna nueva a la tabla.
 */

/** Vista pública: visitante y cliente (RF-10, RF-12). */
export const aProductoPublico = (producto) => ({
  id: producto.id,
  sku: producto.sku,
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  imagenUrl: producto.imagenUrl,
  categoria: producto.categoria,
  subcategoria: producto.subcategoria,
  precioFinal: producto.precioFinal,
  moneda: "CRC",
  disponibilidad: producto.disponibilidad,
  admiteContrapedido: producto.admiteContrapedido,
});

/**
 * Vista administrativa: agrega el desglose de costos.
 * Solo debe usarse detrás de `exigirRol(ROLES.ADMINISTRADOR)` (RNF-10).
 */
export const aProductoAdministrativo = (producto) => ({
  ...aProductoPublico(producto),
  estado: producto.estado,
  costoItem: producto.costoItem,
  porcentajeImportacion: producto.porcentajeImportacion,
  margenGanancia: producto.margenGanancia,
  existencias: producto.existencias,
  desglosePrecio: producto.desglosePrecio,
});

/** Categoría con sus subcategorías, para la barra de categorías de Inicio. */
export const aCategoriaPublica = (categoria) => ({
  id: categoria.id,
  nombre: categoria.nombre,
  cantidadDeProductos: categoria.cantidadDeProductos,
  subcategorias: categoria.subcategorias.map((subcategoria) => ({
    id: subcategoria.id,
    nombre: subcategoria.nombre,
    cantidadDeProductos: subcategoria.cantidadDeProductos,
  })),
});
