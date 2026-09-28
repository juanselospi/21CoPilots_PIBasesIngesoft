/**
 * Columnas de la hoja de productos.
 *
 * Son las mismas del Excel que ya usa el negocio, con los mismos nombres
 * y en el mismo orden. La idea es que el administrador no tenga que
 * cambiar su hoja para importarla. Los montos están en dólares.
 *
 * Las columnas `calculada` son fórmulas del Excel. No se guardan porque
 * el precio lo calcula el motor de precios; precio_venta_con_IVA se lee
 * solo para comparar nuestro cálculo con el de la hoja.
 *
 * El parser y el generador de la plantilla usan esta lista, así que si se
 * agrega una columna basta con ponerla aquí.
 */

export const TIPOS = Object.freeze({
  TEXTO: "texto",
  MONTO: "monto",
  PORCENTAJE: "porcentaje",
});

export const COLUMNAS = Object.freeze([
  { encabezado: "codigo_item", campo: "codigoItem", tipo: TIPOS.TEXTO, obligatoria: true,
    ayuda: "Código interno del ítem, por ejemplo PS5-001. El prefijo indica la subcategoría." },
  { encabezado: "familia", campo: "familia", tipo: TIPOS.TEXTO, obligatoria: true,
    ayuda: "Categoría del producto: Video Juegos, Legos, Trading Cards." },
  { encabezado: "codigo_sku", campo: "codigoSku", tipo: TIPOS.TEXTO, obligatoria: true,
    ayuda: "Código único del producto. Si ya existe, la importación lo actualiza." },
  { encabezado: "descripcion", campo: "descripcion", tipo: TIPOS.TEXTO, obligatoria: false,
    ayuda: "Descripción completa que ve el cliente." },
  { encabezado: "descripcion_corta", campo: "nombre", tipo: TIPOS.TEXTO, obligatoria: true,
    ayuda: "Nombre del producto en el catálogo." },
  { encabezado: "costo_usd", campo: "costo", tipo: TIPOS.MONTO, obligatoria: true,
    ayuda: "Costo del ítem en dólares." },
  { encabezado: "%_costo_importacion", campo: "porcentajeImportacion", tipo: TIPOS.PORCENTAJE, obligatoria: true,
    ayuda: "Porcentaje que se paga por importación." },
  { encabezado: "costo_importacion", campo: null, tipo: TIPOS.MONTO, calculada: true,
    ayuda: "Fórmula: costo_usd × %_costo_importacion." },
  { encabezado: "total_costo_item", campo: null, tipo: TIPOS.MONTO, calculada: true,
    ayuda: "Fórmula: costo_usd + costo_importacion." },
  { encabezado: "%_margen_ganancia", campo: "margenGanancia", tipo: TIPOS.PORCENTAJE, obligatoria: true,
    ayuda: "Margen de ganancia. Puede ser negativo si el producto está en liquidación." },
  { encabezado: "precio_venta_sin_IVA", campo: null, tipo: TIPOS.MONTO, calculada: true,
    ayuda: "Fórmula: total_costo_item × (1 + %_margen_ganancia)." },
  { encabezado: "%_IVA", campo: "porcentajeIva", tipo: TIPOS.PORCENTAJE, obligatoria: false,
    ayuda: "Impuesto de venta. Tiene que ser el mismo que usa el sistema (13 %)." },
  { encabezado: "precio_venta_con_IVA", campo: "precioConIva", tipo: TIPOS.MONTO, calculada: true,
    ayuda: "Fórmula: precio_venta_sin_IVA × (1 + %_IVA)." },
  { encabezado: "url_imagen", campo: "imagenUrl", tipo: TIPOS.TEXTO, obligatoria: false,
    ayuda: "Link de la imagen del producto." },
]);

/** Para comparar encabezados sin importar mayúsculas, tildes ni espacios. */
export const normalizarEncabezado = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
