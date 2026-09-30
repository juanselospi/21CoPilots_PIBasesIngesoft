// Llamadas al servidor para el catálogo público (RF-10, RF-12).
// Son públicas: el visitante no necesita sesión.

import { pedir } from './clienteHttp.js'

/**
 * Devuelve los productos visibles del catálogo, cada uno con
 * { id, sku, nombre, descripcion, imagenUrl, categoria, subcategoria,
 *   precioFinal, moneda, disponibilidad, admiteContrapedido }.
 * Filtros opcionales: `categoria` (id), `q` (texto), `limite` (máx. 48) y `pagina` (empieza en 0).
 */
export function listarProductos({ categoria, q, limite, pagina } = {}, { signal } = {}) {
    return pedir('/api/catalogo/productos', { parametros: { categoria, q, limite, pagina }, signal })
}

// Devuelve las categorías: { id, nombre, cantidadDeProductos, subcategorias }.
// Cada subcategoría trae { id, nombre, cantidadDeProductos }.
export function listarCategorias({ signal } = {}) {
    return pedir('/api/catalogo/categorias', { signal })
}
