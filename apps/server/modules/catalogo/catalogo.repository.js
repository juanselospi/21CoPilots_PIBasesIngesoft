/**
 * CAPA DE PERSISTENCIA — Repositorio del catálogo.
 *
 * Único lugar del módulo que escribe SQL. Devuelve objetos de dominio en
 * camelCase, no filas en snake_case (Data Mapper): si mañana cambia una
 * columna, el cambio muere en este archivo (§ 10.1).
 *
 * Solo escribe en el esquema `catalogo` (§ 9.3). Leer las existencias de
 * `inventario.existencia` está permitido: la regla de propiedad limita la
 * escritura, no la lectura.
 *
 * Todas las consultas usan parámetros ($1, $2...), nunca concatenación:
 * es la defensa contra inyección de SQL.
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
   * La regla de visibilidad (RN-03) la aplica el servicio, no este SQL.
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

  /** Ficha de un producto (RF-12), sin importar su estado. */
  async obtenerPorId(productoId) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
       ${ORIGEN_DE_PRODUCTO}
        WHERE p.id = $1`,
      [productoId]
    );

    return rows[0] ? aProducto(rows[0]) : null;
  }

  /** Categorías con su conteo de productos activos (RF-02). */
  async listarCategorias() {
    const { rows } = await this.#pool.query(
      `SELECT c.id, c.nombre, COUNT(p.id)::int AS cantidad_de_productos
         FROM catalogo.categoria c
    LEFT JOIN catalogo.subcategoria s ON s.categoria_id = c.id
    LEFT JOIN catalogo.producto     p ON p.subcategoria_id = s.id AND p.estado = 'activo'
     GROUP BY c.id, c.nombre
     ORDER BY c.nombre`
    );

    return rows.map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      cantidadDeProductos: fila.cantidad_de_productos,
    }));
  }
}

/**
 * Fila snake_case → objeto de dominio camelCase. PostgreSQL devuelve
 * BIGINT y NUMERIC como texto; aquí se convierten a número.
 */
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
