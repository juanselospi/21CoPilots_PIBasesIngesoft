// Llamadas al servidor para el catálogo público.
// Son públicas: el visitante no necesita sesión para ver el catálogo.

import { pedir } from './clienteHttp.js'

/**
 * Devuelve los productos visibles del catálogo.
 */
export function listarProductos({ categoria, q, orden, limite, pagina } = {}, { signal } = {}) {
    return pedir('/api/catalogo/productos', { parametros: { categoria, q, orden, limite, pagina }, signal })
}

/**
 * Una página del catálogo de la tienda con búsqueda, filtros y orden.
 * Devuelve { datos, meta } (meta trae el total para paginar); `pagina` empieza en 0.
 */
export function listarPaginaDelCatalogo(
    { categoria, q, disponibilidad, precioMin, precioMax, orden, limite, pagina } = {},
    { signal } = {},
) {
    return pedir('/api/catalogo/productos', {
        parametros: { categoria, q, disponibilidad, precioMin, precioMax, orden, limite, pagina },
        signal,
        conMeta: true,
    })
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

// Productos del panel de administración, incluidos los ocultos en la tienda.
// Devuelve { datos, meta } (meta trae el total para paginar); `pagina` empieza en 0.
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

// Familias del panel, incluidas las desactivadas, con su importación y su margen.
export function listarFamiliasAdmin({ signal } = {}) {
    return pedir('/api/catalogo/admin/familias', { signal })
}

// Registra una familia; importación y margen vacíos valen 0. El nombre no se puede repetir.
export function crearFamilia(familia, { signal } = {}) {
    return pedir('/api/catalogo/familias', { metodo: 'POST', cuerpo: familia, signal })
}

// Cambia el nombre, la descripción, la importación, el margen o si está activa.
// Desactivarla oculta sus productos de la tienda.
export function actualizarFamilia(nombre, cambios, { signal } = {}) {
    return pedir(`/api/catalogo/familias/${encodeURIComponent(nombre)}`, { metodo: 'PATCH', cuerpo: cambios, signal })
}

// Borra una familia sin productos. Si tiene, el servidor responde 409 con el motivo.
export function eliminarFamilia(nombre, { signal } = {}) {
    return pedir(`/api/catalogo/familias/${encodeURIComponent(nombre)}`, { metodo: 'DELETE', signal })
}

// Guarda los datos generales, el costo, la importación, el margen, las existencias o el
// contrapedido de un producto (RF-01, RF-18). Importación y margen en null heredan de la familia.
// El servidor recalcula el precio y devuelve el producto actualizado.
export function actualizarProducto(sku, cambios, { signal } = {}) {
    return pedir(`/api/catalogo/productos/${encodeURIComponent(sku)}`, { metodo: 'PATCH', cuerpo: cambios, signal })
}

// Desactiva ('descontinuado': sale de la tienda y conserva su historial) o reactiva ('activo')
// un producto (RF-18).
export function cambiarEstadoProducto(sku, estado, { signal } = {}) {
    return pedir(`/api/catalogo/productos/${encodeURIComponent(sku)}/estado`, { metodo: 'PATCH', cuerpo: { estado }, signal })
}

// Elimina un producto; su historial se conserva. Si está en un pedido sin finalizar el servidor
// responde 409 (PRODUCTO_EN_PEDIDO_ACTIVO) y se puede desactivar en su lugar.
export function eliminarProducto(sku, { signal } = {}) {
    return pedir(`/api/catalogo/productos/${encodeURIComponent(sku)}`, { metodo: 'DELETE', signal })
}

// Registra un producto nuevo (el código no se puede repetir) y lo devuelve con su precio.
export function crearProducto(producto, { signal } = {}) {
    return pedir('/api/catalogo/productos', { metodo: 'POST', cuerpo: producto, signal })
}
