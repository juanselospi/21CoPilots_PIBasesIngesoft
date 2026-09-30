/**
 * Repositorio del catálogo.
 *
 * Es el único archivo del módulo con SQL. Devuelve objetos en camelCase
 * y no filas de la base, así que si cambia una columna solo hay que
 * tocar este archivo.
 *
 * La tabla sigue el EER: el SKU es la llave, la categoría es un texto y
 * el stock vive en el mismo producto. aProducto() traduce esas columnas a
 * los nombres que usa el dominio (costoItem, porcentajeImportacion,
 * existencias...), así el motor de precios no depende del esquema.
 *
 * Las consultas siempre usan parámetros ($1, $2...) y nunca concatenan
 * texto, para evitar inyección de SQL.
 */

const COLUMNAS_DE_PRODUCTO = `
       sku,
       nombre,
       descripcion,
       imagen,
       categoria,
       item,
       importacion,
       margen_ganancia,
       contrapedido,
       stock`;

export class CatalogoRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /**
   * Productos con filtro opcional por categoría y por nombre.
   * Qué productos se muestran al público lo decide el servicio, no este SQL.
   */
  async listar({ categoria = null, termino = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM catalogo.producto
        WHERE ($1::text IS NULL OR categoria = $1)
          AND ($2::text IS NULL OR nombre ILIKE '%' || $2 || '%')
        ORDER BY nombre`,
      [categoria, termino]
    );

    return rows.map(aProducto);
  }

  /**
   * Ficha de un producto, sea visible o no. El SKU se guarda normalizado
   * (mayúsculas, sin espacios en los extremos), así que se busca igual.
   */
  async obtenerPorSku(sku) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM catalogo.producto
        WHERE sku = upper(btrim($1))`,
      [sku]
    );

    return rows[0] ? aProducto(rows[0]) : null;
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

// Pasa la fila de la base a los nombres del dominio. PostgreSQL devuelve
// NUMERIC como texto, así que aquí se convierten a número.
const aProducto = (fila) => ({
  sku: fila.sku,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  imagenUrl: fila.imagen,
  categoria: fila.categoria,
  costoItem: Number(fila.item),
  porcentajeImportacion: Number(fila.importacion),
  margenGanancia: Number(fila.margen_ganancia),
  admiteContrapedido: fila.contrapedido,
  existencias: fila.stock,
});
