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
  sku: producto.sku,
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  imagenUrl: producto.imagenUrl,
  categoria: producto.categoria,
  precioFinal: producto.precioFinal,
  moneda: "USD",
  disponibilidad: producto.disponibilidad,
  admiteContrapedido: producto.admiteContrapedido,
});

/**
 * Vista administrativa: agrega el desglose de costos.
 * Solo debe usarse detrás de `exigirRol(ROLES.ADMINISTRADOR)` (RNF-10).
 */
export const aProductoAdministrativo = (producto) => ({
  ...aProductoPublico(producto),
  proveedor: producto.proveedor,
  costoItem: producto.costoItem,
  porcentajeImportacion: producto.porcentajeImportacion,
  margenGanancia: producto.margenGanancia,
  tasaImpuesto: producto.tasaImpuesto,
  existencias: producto.existencias,
  desglosePrecio: producto.desglosePrecio,
  etiquetas: producto.etiquetas ?? [],
});

/** Categoria para la barra de categorias de Inicio, se filtra por su nombre. */
export const aCategoriaPublica = (categoria) => ({
  nombre: categoria.nombre,
  cantidadDeProductos: categoria.cantidadDeProductos,
});
