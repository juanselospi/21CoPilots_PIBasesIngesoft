/**
 * Repositorio del catálogo.
 *
 * Es el único archivo del módulo con SQL. Devuelve objetos en camelCase
 * y no filas de la base, así que si cambia una columna solo hay que
 * tocar este archivo.
 *
 * Solo escribe en el esquema `catalogo`. El producto se identifica por su SKU,
 * la categoria es texto y el stock vive en la misma fila del producto.
 *
 * Las consultas siempre usan parámetros ($1, $2...) y nunca concatenan
 * texto, para evitar inyección de SQL.
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



/**
 * Productos con filtro opcional por categoría y por nombre.
 * Qué productos se muestran al público lo decide el servicio, no este SQL.
 */

/** Ficha de un producto por su SKU, que tiene que venir normalizado. */

/** Categorias con la cantidad de productos de cada una. */

/**
 * Guarda un producto de la importación: lo crea si el SKU no existe y lo
 * actualiza si ya existe, así reimportar la misma hoja no duplica nada
 * (RF-59).
 *
 * Al actualizar no se tocan contrapedido, proveedor ni stock, porque la
 * hoja no los trae y el administrador pudo cambiarlos a mano. Tampoco se
 * borra una descripción o imagen si en la hoja vienen vacías. costo_total
 * no se manda nunca porque es una columna generada.
 *
 * Se llama dentro de la transacción de la importación, con el `cliente`
 * que entrega enTransaccion.
 */


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
   * Registra un producto nuevo desde el panel. Devuelve su SKU, o null si
   * ya existe otro con ese código. Con ON CONFLICT DO NOTHING la base
   * decide sola, así dos registros al mismo tiempo no pueden duplicarlo.
   *
   * El stock y la tasa de impuesto quedan con sus valores por defecto
   * (0 y 13 %), y costo_total no se manda porque es una columna generada.
   */
  async crear(producto) {
    const { rows } = await this.#pool.query(
      `INSERT INTO catalogo.producto
              (sku, nombre, descripcion, categoria, proveedor, imagen,
               item, importacion, margen_ganancia, contrapedido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      ]
    );

    return rows[0]?.sku ?? null;
  }

  async listarCategorias() {
    const { rows } = await this.#pool.query(
      `SELECT categoria AS nombre,
              COUNT(*)::int AS cantidad_de_productos
         FROM catalogo.producto
        GROUP BY categoria
        ORDER BY categoria`
    );

    return rows.map((fila) => ({
      nombre: fila.nombre,
      cantidadDeProductos: fila.cantidad_de_productos,
    }));
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
