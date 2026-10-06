// Llamadas al servidor para el catálogo público.
// Son públicas: el visitante no necesita sesión para ver el catálogo.

import { pedir } from './clienteHttp.js'

/**
 * Devuelve los productos visibles del catálogo.
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

// Productos del panel de administración, incluidos los ocultos en la tienda (RF-43).
// Devuelve { datos, meta } donde meta trae el total para paginar.
// Todos los filtros son opcionales; `pagina` empieza en 0.
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

// Guarda el costo, la importación, el margen, las existencias o el contrapedido
// de un producto (RF-01). El servidor recalcula el precio y devuelve el producto actualizado.
export function actualizarProducto(sku, cambios, { signal } = {}) {
    return pedir(`/api/catalogo/productos/${encodeURIComponent(sku)}`, { metodo: 'PATCH', cuerpo: cambios, signal })
}

// Registra un producto nuevo; el código no se puede repetir (RF-01).
// Devuelve el producto guardado con su precio calculado.
export function crearProducto(producto, { signal } = {}) {
    return pedir('/api/catalogo/productos', { metodo: 'POST', cuerpo: producto, signal })
}
