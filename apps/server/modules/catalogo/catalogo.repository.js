/**
 * Repositorio del catálogo.
 *
 * Es el único archivo del módulo con SQL. Devuelve objetos en camelCase
 * y no filas de la base, así que si cambia una columna solo hay que
 * tocar este archivo.
 *
 * Solo escribe en el esquema `catalogo`. Leer `inventario.existencia`
 * está bien: lo que no se permite es escribir en tablas de otro módulo.
 *
 * Las consultas siempre usan parámetros ($1, $2...) y nunca concatenan
 * texto, para evitar inyección de SQL.
 */

const COLUMNAS_DE_PRODUCTO = `
       p.id,
       p.sku,
       p.nombre,
       p.descripcion,
       p.imagen_url,
       p.costo_item,
       p.porcentaje_importacion,
       p.margen_ganancia,
       p.admite_contrapedido,
       p.estado,
       coalesce(e.cantidad, 0) AS existencias,
       c.id     AS categoria_id,
       c.nombre AS categoria,
       s.id     AS subcategoria_id,
       s.nombre AS subcategoria`;

const ORIGEN_DE_PRODUCTO = `
  FROM catalogo.producto        p
  JOIN catalogo.subcategoria    s ON s.id = p.subcategoria_id
  JOIN catalogo.categoria       c ON c.id = s.categoria_id
  LEFT JOIN inventario.existencia e ON e.producto_id = p.id`;

export class CatalogoRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /**
   * Productos activos, con filtro opcional por categoría y por nombre.
   * Qué productos se muestran al público lo decide el servicio, no este SQL.
   */
  async listarActivos({ categoriaId = null, termino = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
       ${ORIGEN_DE_PRODUCTO}
        WHERE p.estado = 'activo'
          AND ($1::int  IS NULL OR c.id = $1)
          AND ($2::text IS NULL OR p.nombre ILIKE '%' || $2 || '%')
        ORDER BY p.nombre`,
      [categoriaId, termino]
    );

    return rows.map(aProducto);
  }

  /** Ficha de un producto, sin importar su estado. */
  async obtenerPorId(productoId) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
       ${ORIGEN_DE_PRODUCTO}
        WHERE p.id = $1`,
      [productoId]
    );

    return rows[0] ? aProducto(rows[0]) : null;
  }

  /**
   * Categorías con sus subcategorías, y cuántos productos activos tiene
   * cada una. Sale una fila por subcategoría y aquí se agrupan.
   */
  async listarCategorias() {
    const { rows } = await this.#pool.query(
      `SELECT c.id     AS categoria_id,
              c.nombre AS categoria,
              s.id     AS subcategoria_id,
              s.nombre AS subcategoria,
              COUNT(p.id)::int AS cantidad_de_productos
         FROM catalogo.categoria c
    LEFT JOIN catalogo.subcategoria s ON s.categoria_id = c.id
    LEFT JOIN catalogo.producto     p ON p.subcategoria_id = s.id AND p.estado = 'activo'
     GROUP BY c.id, c.nombre, s.id, s.nombre
     ORDER BY c.nombre, s.nombre`
    );

    return agruparPorCategoria(rows);
  }

  /**
   * Guarda un producto de la importación: lo crea si el SKU no existe y lo
   * actualiza si ya existe, así reimportar la misma hoja no duplica nada
   * (RF-59). La categoría y la subcategoría se crean si hace falta.
   *
   * Al actualizar no se tocan contrapedido, proveedor ni estado, porque la
   * hoja no los trae y el administrador pudo cambiarlos a mano. Tampoco se
   * borra una descripción o imagen si en la hoja vienen vacías.
   *
   * Se llama dentro de la transacción de la importación, con el `cliente`
   * que entrega enTransaccion.
   *
   * @returns {Promise<{id: number, insertado: boolean}>}
   */
  async guardarPorSku(cliente, producto) {
    const categoriaId = await idDeCategoria(cliente, producto.categoria);
    const subcategoriaId = await idDeSubcategoria(cliente, categoriaId, producto.subcategoria);

    // xmax = 0 solo en filas recién insertadas; así sabemos si fue
    // inserción o actualización sin hacer otra consulta.
    const { rows } = await cliente.query(
      `INSERT INTO catalogo.producto
              (sku, nombre, descripcion, subcategoria_id, imagen_url,
               costo_item, porcentaje_importacion, margen_ganancia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (sku) DO UPDATE SET
              nombre                 = EXCLUDED.nombre,
              descripcion            = coalesce(EXCLUDED.descripcion, producto.descripcion),
              subcategoria_id        = EXCLUDED.subcategoria_id,
              imagen_url             = coalesce(EXCLUDED.imagen_url, producto.imagen_url),
              costo_item             = EXCLUDED.costo_item,
              porcentaje_importacion = EXCLUDED.porcentaje_importacion,
              margen_ganancia        = EXCLUDED.margen_ganancia
       RETURNING id, (xmax = 0) AS insertado`,
      [
        producto.sku,
        producto.nombre,
        producto.descripcion,
        subcategoriaId,
        producto.imagenUrl,
        producto.costoItem,
        producto.porcentajeImportacion,
        producto.margenGanancia,
      ]
    );

    return { id: Number(rows[0].id), insertado: rows[0].insertado };
  }
}

// El DO UPDATE que no cambia nada es para que RETURNING devuelva el id
// también cuando la categoría ya existía (con DO NOTHING no lo devuelve).
// Si ya existe, se respeta cómo estaba escrito el nombre.
async function idDeCategoria(cliente, nombre) {
  const { rows } = await cliente.query(
    `INSERT INTO catalogo.categoria (nombre) VALUES ($1)
     ON CONFLICT ((lower(btrim(nombre)))) DO UPDATE SET nombre = categoria.nombre
     RETURNING id`,
    [nombre]
  );
  return rows[0].id;
}

async function idDeSubcategoria(cliente, categoriaId, nombre) {
  const { rows } = await cliente.query(
    `INSERT INTO catalogo.subcategoria (categoria_id, nombre) VALUES ($1, $2)
     ON CONFLICT (categoria_id, (lower(btrim(nombre)))) DO UPDATE SET nombre = subcategoria.nombre
     RETURNING id`,
    [categoriaId, nombre]
  );
  return rows[0].id;
}

/**
 * Arma el árbol de categorías con sus subcategorías a partir de una fila
 * por subcategoría. Una categoría sin subcategorías llega con
 * subcategoria_id en null y queda con la lista vacía.
 */
export function agruparPorCategoria(filas) {
  const categorias = new Map();

  for (const fila of filas) {
    if (!categorias.has(fila.categoria_id)) {
      categorias.set(fila.categoria_id, {
        id: fila.categoria_id,
        nombre: fila.categoria,
        cantidadDeProductos: 0,
        subcategorias: [],
      });
    }
    if (fila.subcategoria_id === null) continue;

    const categoria = categorias.get(fila.categoria_id);
    categoria.cantidadDeProductos += fila.cantidad_de_productos;
    categoria.subcategorias.push({
      id: fila.subcategoria_id,
      nombre: fila.subcategoria,
      cantidadDeProductos: fila.cantidad_de_productos,
    });
  }

  return [...categorias.values()];
}

// Pasa la fila de la base a camelCase. PostgreSQL devuelve BIGINT y
// NUMERIC como texto, así que aquí se convierten a número.
const aProducto = (fila) => ({
  id: Number(fila.id),
  sku: fila.sku,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  imagenUrl: fila.imagen_url,
  costoItem: Number(fila.costo_item),
  porcentajeImportacion: Number(fila.porcentaje_importacion),
  margenGanancia: Number(fila.margen_ganancia),
  admiteContrapedido: fila.admite_contrapedido,
  estado: fila.estado,
  existencias: Number(fila.existencias),
  categoriaId: fila.categoria_id,
  categoria: fila.categoria,
  subcategoriaId: fila.subcategoria_id,
  subcategoria: fila.subcategoria,
});
