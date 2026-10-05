/**
 * Repositorio del catálogo.
 *
 * Solo escribe en el esquema `catalogo`. El producto se identifica por su SKU,
 * la categoria es texto y el stock vive en la misma fila del producto.
 */

const COLUMNAS_DE_PRODUCTO = `
       p.sku,
       p.nombre,
       p.descripcion,
       p.imagen,
       p.item,
       p.importacion,
       p.margen_ganancia,
       p.tasa_impuesto,
       p.contrapedido,
       p.stock,
       p.categoria,
       p.proveedor`;

// Guarda un producto de la importación (inserta si no existe y actualiza si ya existe)
export class CatalogoRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  async listar({ categoria = null, termino = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM catalogo.producto p
        WHERE ($1::text IS NULL OR p.categoria = $1)
          AND ($2::text IS NULL OR p.nombre ILIKE '%' || $2 || '%')
        ORDER BY p.nombre`,
      [categoria, termino]
    );

    return rows.map(aProducto);
  }

  /**
   * Productos para el panel del administrador. El término busca en el
   * nombre o en el SKU, porque el administrador suele buscar por código.
   * Los filtros que dependen del precio o de la disponibilidad los aplica
   * el servicio, que es quien los calcula.
   */
  async listarParaAdministracion({ termino = null, categoria = null, proveedor = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM catalogo.producto p
        WHERE ($1::text IS NULL OR p.nombre ILIKE '%' || $1 || '%'
                                OR p.sku ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR p.categoria = $2)
          AND ($3::text IS NULL OR p.proveedor = $3)
        ORDER BY p.nombre`,
      [termino, categoria, proveedor]
    );

    return rows.map(aProducto);
  }

  async obtenerPorSku(sku) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM catalogo.producto p
        WHERE p.sku = $1`,
      [sku]
    );

    return rows[0] ? aProducto(rows[0]) : null;
  }

  /**
   * Registra un producto nuevo desde el panel
   */
  async crear(producto) {
    const { rows } = await this.#pool.query(
      `INSERT INTO catalogo.producto
              (sku, nombre, descripcion, categoria, proveedor, imagen,
               item, importacion, margen_ganancia, contrapedido, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (sku) DO NOTHING
       RETURNING sku`,
      [
        producto.sku,
        producto.nombre,
        producto.descripcion,
        producto.categoria,
        producto.proveedor,
        producto.imagenUrl,
        producto.costoItem,
        producto.porcentajeImportacion,
        producto.margenGanancia,
        producto.admiteContrapedido,
        producto.existencias,
      ]
    );

    return rows[0]?.sku ?? null;
  }

  /**
   * Cambia el precio (costo, importación y margen), el stock o el
   * contrapedido de un producto.
   *
   * costo_total no se manda porque es una columna generada.
   *
   * @returns el SKU, o null si no existe el producto
   */
  async actualizar(
    sku,
    {
      costoItem = null,
      porcentajeImportacion = null,
      margenGanancia = null,
      existencias = null,
      admiteContrapedido = null,
    }
  ) {
    const { rows } = await this.#pool.query(
      `UPDATE catalogo.producto
          SET item            = COALESCE($2, item),
              importacion     = COALESCE($3, importacion),
              margen_ganancia = COALESCE($4, margen_ganancia),
              stock           = COALESCE($5, stock),
              contrapedido    = COALESCE($6, contrapedido)
        WHERE sku = $1
       RETURNING sku`,
      [sku, costoItem, porcentajeImportacion, margenGanancia, existencias, admiteContrapedido]
    );

    return rows[0]?.sku ?? null;
  }

  async guardarPorSku(cliente, producto) {
    const { rows } = await cliente.query(
      `INSERT INTO catalogo.producto
              (sku, nombre, descripcion, categoria, imagen,
               item, importacion, margen_ganancia, tasa_impuesto)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (sku) DO UPDATE SET
              nombre          = EXCLUDED.nombre,
              descripcion     = coalesce(EXCLUDED.descripcion, producto.descripcion),
              categoria       = EXCLUDED.categoria,
              imagen          = coalesce(EXCLUDED.imagen, producto.imagen),
              item            = EXCLUDED.item,
              importacion     = EXCLUDED.importacion,
              margen_ganancia = EXCLUDED.margen_ganancia,
              tasa_impuesto   = EXCLUDED.tasa_impuesto
       RETURNING sku, (xmax = 0) AS insertado`,
      [
        producto.sku,
        producto.nombre,
        producto.descripcion,
        producto.categoria,
        producto.imagenUrl,
        producto.costoItem,
        producto.porcentajeImportacion,
        producto.margenGanancia,
        producto.tasaImpuesto,
      ]
    );

    return { sku: rows[0].sku, insertado: rows[0].insertado };
  }
}

// Pasa la fila de la base a camelCase. 
// PostgreSQL devuelve NUMERIC como texto, aqui se convierten a numero
const aProducto = (fila) => ({
  sku: fila.sku,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  imagenUrl: fila.imagen,
  costoItem: Number(fila.item),
  porcentajeImportacion: Number(fila.importacion),
  margenGanancia: Number(fila.margen_ganancia),
  tasaImpuesto: Number(fila.tasa_impuesto),
  admiteContrapedido: fila.contrapedido,
  existencias: fila.stock,
  categoria: fila.categoria,
  proveedor: fila.proveedor,
});
