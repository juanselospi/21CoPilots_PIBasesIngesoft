/**
 * Repositorio del catálogo.
 *
 * Es el único archivo del módulo con SQL. Devuelve objetos en camelCase.
 *
 * Solo escribe en el esquema `catalogo`. El producto se identifica por su SKU
 * y su categoría es el nombre de una familia.
 *
 * La importación y el margen del producto salen tal como están guardados
 * (null si usa los de la familia) junto con los de su familia; cuál vale lo
 * decide el dominio.
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
       p.proveedor,
       p.estado,
       f.importacion     AS importacion_familia,
       f.margen_ganancia AS margen_familia,
       f.activa          AS familia_activa`;

const PRODUCTO_CON_FAMILIA = `
       catalogo.producto p
  JOIN catalogo.familia  f ON f.nombre = p.categoria`;

// "Legos", "legos" y " Legos  " son la misma familia: se comparan sin
// mayúsculas y con los espacios normalizados.
const nombreComparable = (expresion) => `lower(regexp_replace(btrim(${expresion}), '\\s+', ' ', 'g'))`;
const MISMA_FAMILIA = `${nombreComparable("f.nombre")} = ${nombreComparable("$1")}`;

const COLUMNAS_DE_FAMILIA = `
       f.nombre,
       f.descripcion,
       f.importacion,
       f.margen_ganancia,
       f.activa,
       (SELECT count(*) FROM catalogo.producto p WHERE p.categoria = f.nombre)::int AS total_de_productos`;

// Campo del dominio → columna, para armar los UPDATE solo con lo que cambia.
const COLUMNA_DE_PRODUCTO = Object.freeze({
  nombre: "nombre",
  descripcion: "descripcion",
  categoria: "categoria",
  proveedor: "proveedor",
  imagenUrl: "imagen",
  costoItem: "item",
  porcentajeImportacion: "importacion",
  margenGanancia: "margen_ganancia",
  existencias: "stock",
  admiteContrapedido: "contrapedido",
  estado: "estado",
});

const COLUMNA_DE_FAMILIA = Object.freeze({
  nombre: "nombre",
  descripcion: "descripcion",
  porcentajeImportacion: "importacion",
  margenGanancia: "margen_ganancia",
  activa: "activa",
});



/**
 * Productos con filtro opcional por categoría y por nombre.
 * Qué productos se muestran al público lo decide el servicio, no este SQL.
 */

/** Ficha de un producto por su SKU, que tiene que venir normalizado. */

export class CatalogoRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  async listar({ categoria = null, termino = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM ${PRODUCTO_CON_FAMILIA}
        WHERE ($1::text IS NULL OR p.categoria = $1)
          AND ($2::text IS NULL OR p.nombre ILIKE '%' || $2 || '%')
        ORDER BY p.nombre`,
      [categoria, termino]
    );

    return rows.map(aProducto);
  }

  /** Busca por nombre o SKU; los filtros de precio los aplica el servicio. */
  async listarParaAdministracion({ termino = null, categoria = null, proveedor = null } = {}) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM ${PRODUCTO_CON_FAMILIA}
        WHERE ($1::text IS NULL OR p.nombre ILIKE '%' || $1 || '%'
                                OR p.sku ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR p.categoria = $2)
          AND ($3::text IS NULL OR p.proveedor = $3)
        ORDER BY p.nombre`,
      [termino, categoria, proveedor]
    );

    return rows.map(aProducto);
  }

  /** Varios productos por SKU de una vez, para el carrito. */
  async obtenerVarios(skus) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM ${PRODUCTO_CON_FAMILIA}
        WHERE p.sku = ANY($1::text[])`,
      [skus]
    );
    return rows.map(aProducto);
  }

  async obtenerPorSku(sku) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_PRODUCTO}
         FROM ${PRODUCTO_CON_FAMILIA}
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
   * Cambia solo los campos que vienen. Importación o margen en null hacen
   * que el producto vuelva a usar los de su familia.
   * @returns el SKU, o null si no existe el producto
   */
  async actualizar(sku, cambios) {
    const campos = Object.keys(cambios);
    const asignaciones = campos.map((campo, indice) => `${COLUMNA_DE_PRODUCTO[campo]} = $${indice + 2}`);

    const { rows } = await this.#pool.query(
      `UPDATE catalogo.producto SET ${asignaciones.join(", ")} WHERE sku = $1 RETURNING sku`,
      [sku, ...campos.map((campo) => cambios[campo])]
    );

    return rows[0]?.sku ?? null;
  }

  /**
   * Borra el producto solo si no tiene líneas de pedido ni movimientos.
   * @returns "eliminado", "con_historial" o "no_existe"
   */
  async eliminar(sku) {
    try {
      const { rows } = await this.#pool.query(
        `DELETE FROM catalogo.producto p
          WHERE p.sku = $1
            AND NOT EXISTS (SELECT 1 FROM pedidos.agrega a WHERE a.sku = p.sku)
            AND NOT EXISTS (SELECT 1 FROM inventario.producto_administra m WHERE m.sku = p.sku)
         RETURNING sku`,
        [sku]
      );
      if (rows[0]) return "eliminado";
    } catch (error) {
      // Una venta entró entre la revisión y el borrado: la llave foránea lo frena
      if (error.code === "23503") return "con_historial";
      throw error;
    }

    const { rows } = await this.#pool.query(`SELECT 1 FROM catalogo.producto WHERE sku = $1`, [sku]);
    return rows[0] ? "con_historial" : "no_existe";
  }

  /**
   * Guarda un producto de la importación: lo crea si el SKU no existe y lo
   * actualiza si ya existe, así reimportar la misma hoja no duplica nada.
   * Si su familia no existe la crea con la importación y el margen de la fila.
   */
  async guardarPorSku(cliente, producto) {
    const categoria = await asegurarFamilia(cliente, producto);

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
        categoria,
        producto.imagenUrl,
        producto.costoItem,
        producto.porcentajeImportacion,
        producto.margenGanancia,
        producto.tasaImpuesto,
      ]
    );

    return { sku: rows[0].sku, insertado: rows[0].insertado };
  }

  async listarFamilias() {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_FAMILIA}
         FROM catalogo.familia f
        ORDER BY f.nombre`
    );
    return rows.map(aFamilia);
  }

  /** Busca sin importar mayúsculas ni espacios; null si no existe. */
  async buscarFamilia(nombre) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNAS_DE_FAMILIA}
         FROM catalogo.familia f
        WHERE ${MISMA_FAMILIA}`,
      [nombre]
    );
    return rows[0] ? aFamilia(rows[0]) : null;
  }

  async crearFamilia({ nombre, descripcion, porcentajeImportacion, margenGanancia }) {
    await this.#pool.query(
      `INSERT INTO catalogo.familia (nombre, descripcion, importacion, margen_ganancia)
       VALUES ($1, $2, $3, $4)`,
      [nombre, descripcion, porcentajeImportacion, margenGanancia]
    );
  }

  /**
   * Cambia solo los campos que vienen. Renombrar arrastra a sus productos
   * por el ON UPDATE CASCADE de la llave foránea.
   */
  async actualizarFamilia(nombre, cambios) {
    const campos = Object.keys(cambios);
    const asignaciones = campos.map((campo, indice) => `${COLUMNA_DE_FAMILIA[campo]} = $${indice + 2}`);

    await this.#pool.query(
      `UPDATE catalogo.familia SET ${asignaciones.join(", ")} WHERE nombre = $1`,
      [nombre, ...campos.map((campo) => cambios[campo])]
    );
  }

  async eliminarFamilia(nombre) {
    await this.#pool.query(`DELETE FROM catalogo.familia WHERE nombre = $1`, [nombre]);
  }
}

/**
 * Devuelve el nombre de la familia tal como está guardado. "legos" y
 * "Legos " son la misma familia, así una hoja escrita a mano no duplica.
 */
async function asegurarFamilia(cliente, { categoria, porcentajeImportacion, margenGanancia }) {
  const { rows } = await cliente.query(`SELECT f.nombre FROM catalogo.familia f WHERE ${MISMA_FAMILIA}`, [
    categoria,
  ]);
  if (rows[0]) return rows[0].nombre;

  await cliente.query(
    `INSERT INTO catalogo.familia (nombre, importacion, margen_ganancia)
     VALUES ($1, $2, $3)
     ON CONFLICT (nombre) DO NOTHING`,
    [categoria, porcentajeImportacion ?? 0, margenGanancia ?? 0]
  );
  return categoria;
}

// Pasa la fila de la base a camelCase.
// PostgreSQL devuelve NUMERIC como texto, aqui se convierten a numero.
const aProducto = (fila) => ({
  sku: fila.sku,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  imagenUrl: fila.imagen,
  costoItem: Number(fila.item),
  porcentajeImportacion: numeroONulo(fila.importacion),
  margenGanancia: numeroONulo(fila.margen_ganancia),
  familia: {
    porcentajeImportacion: Number(fila.importacion_familia),
    margenGanancia: Number(fila.margen_familia),
    activa: fila.familia_activa,
  },
  tasaImpuesto: Number(fila.tasa_impuesto),
  admiteContrapedido: fila.contrapedido,
  existencias: fila.stock,
  categoria: fila.categoria,
  proveedor: fila.proveedor,
  estado: fila.estado,
});

const numeroONulo = (valor) => (valor === null ? null : Number(valor));

const aFamilia = (fila) => ({
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  porcentajeImportacion: Number(fila.importacion),
  margenGanancia: Number(fila.margen_ganancia),
  activa: fila.activa,
  totalDeProductos: fila.total_de_productos,
});
