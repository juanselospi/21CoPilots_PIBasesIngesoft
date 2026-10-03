// Llamadas al servidor para el catálogo público (RF-10, RF-12).
// Son públicas: el visitante no necesita sesión.

import { pedir } from './clienteHttp.js'

/**
 * Devuelve los productos visibles del catálogo, cada uno con
 * { sku, nombre, descripcion, imagenUrl, categoria, precioFinal, moneda,
 *   disponibilidad, admiteContrapedido }.
 * 
 *  Filtros opcionales: `categoria` (nombre), `q` (texto del nombre),
 * `limite` (máx. 48) y `pagina` (empieza en 0).
 */
export function listarProductos({ categoria, q, limite, pagina } = {}, { signal } = {}) {
    return pedir('/api/catalogo/productos', { parametros: { categoria, q, limite, pagina }, signal })
}

// Devuelve la ficha de un producto visible, con los mismos campos que el listado.
// Si no existe o esta oculto el servidor responde 404
export function obtenerProducto(sku, { signal } = {}) {
    return pedir(`/api/catalogo/productos/${encodeURIComponent(sku)}`, { signal })
}

// Devuelve las categorías: { nombre, cantidadDeProductos }.
export function listarCategorias({ signal } = {}) {
    return pedir('/api/catalogo/categorias', { signal })
}

/**
 * Listado del panel (RF-43): todos los productos, también los que no se ven
 * en la tienda. Solo administrador; viaja con la cookie de sesión.
 *
 * Devuelve { datos, meta: { total, pagina, limite } }. Cada producto trae lo
 * del catálogo público más proveedor, costoItem, porcentajeImportacion,
 * margenGanancia, tasaImpuesto, existencias, desglosePrecio y etiquetas.
 *
 * Filtros opcionales: `q` (nombre o código), `categoria`, `proveedor`,
 * `disponibilidad`, `existenciasBajas`, `margenNegativo`, `precioMin`,
 * `precioMax`. Orden: `nombre`, `-nombre`, `precio`, `-precio`,
 * `existencias` o `sku`. `limite` es 24, 48 o 96 y `pagina` empieza en 0.
 */
export function listarParaAdministracion(
    { q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina } = {},
    { signal } = {},
) {
    return pedir('/api/catalogo/admin/productos', {
        parametros: { q, categoria, proveedor, disponibilidad, existenciasBajas, margenNegativo, precioMin, precioMax, orden, limite, pagina },
        signal,
        conMeta: true,
    })
}
