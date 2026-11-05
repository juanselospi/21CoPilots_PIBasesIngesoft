// Estado del catálogo de la tienda en la URL: búsqueda, filtros, orden y página.
// Vive en la URL para que sobreviva a recargar, se pueda compartir y la flecha de regreso
// del producto vuelva exactamente aquí. Lo que venga mal se ignora y queda el valor por defecto.

export const PRODUCTOS_POR_PAGINA = 12
export const ORDEN_POR_DEFECTO = 'nombre'

// Los mismos órdenes que acepta el servidor (ORDENES_DE_TIENDA)
export const ordenesDelCatalogo = [
    { value: 'nombre', label: 'Nombre: A–Z' },
    { value: '-nombre', label: 'Nombre: Z–A' },
    { value: 'precio', label: 'Precio: menor a mayor' },
    { value: '-precio', label: 'Precio: mayor a menor' },
]

// Lo que el visitante puede ver; los estados del panel no se exponen
export const disponibilidadesDelCatalogo = [
    { value: 'en_existencia', label: 'En existencia' },
    { value: 'por_contrapedido', label: 'Disponible por contrapedido' },
]

const PRECIO = /^\d+(\.\d+)?$/
const ENTERO_POSITIVO = /^[1-9]\d{0,5}$/

const texto = (parametros, nombre) => parametros.get(nombre)?.trim() ?? ''
const deLaLista = (valor, opciones, porDefecto) => (opciones.some(({ value }) => value === valor) ? valor : porDefecto)

/**
 * Lee la consulta de la URL. `pagina` empieza en 0 (en la URL, en 1, como la ve el usuario).
 * Con `conCategoria: false` (dentro de una categoría) se ignora el parámetro `categoria`.
 */
export function leerConsultaDelCatalogo(parametros, { conCategoria = true } = {}) {
    const precioMin = PRECIO.test(texto(parametros, 'precioMin')) ? texto(parametros, 'precioMin') : ''
    let precioMax = PRECIO.test(texto(parametros, 'precioMax')) ? texto(parametros, 'precioMax') : ''
    // Un rango al revés no tiene resultados posibles: se queda solo el mínimo
    if (precioMin !== '' && precioMax !== '' && Number(precioMin) > Number(precioMax)) precioMax = ''

    const pagina = texto(parametros, 'pagina')
    return {
        q: texto(parametros, 'q'),
        categoria: conCategoria ? texto(parametros, 'categoria') : '',
        disponibilidad: deLaLista(texto(parametros, 'disponibilidad'), disponibilidadesDelCatalogo, ''),
        precioMin,
        precioMax,
        orden: deLaLista(texto(parametros, 'orden'), ordenesDelCatalogo, ORDEN_POR_DEFECTO),
        pagina: ENTERO_POSITIVO.test(pagina) ? Number(pagina) - 1 : 0,
    }
}

/** La consulta como parámetros de URL, sin los valores por defecto para que la URL quede corta. */
export function parametrosDelCatalogo({ q, categoria, disponibilidad, precioMin, precioMax, orden, pagina }) {
    const parametros = new URLSearchParams()
    if (q) parametros.set('q', q)
    if (categoria) parametros.set('categoria', categoria)
    if (disponibilidad) parametros.set('disponibilidad', disponibilidad)
    if (precioMin !== '') parametros.set('precioMin', precioMin)
    if (precioMax !== '') parametros.set('precioMax', precioMax)
    if (orden && orden !== ORDEN_POR_DEFECTO) parametros.set('orden', orden)
    if (pagina > 0) parametros.set('pagina', String(pagina + 1))
    return parametros
}

/** «Mostrando 13–24 de 50 productos»; `pagina` empieza en 0. */
export function textoDeResultados(pagina, total, porPagina = PRODUCTOS_POR_PAGINA) {
    if (total === 0) return 'Sin resultados'
    const desde = pagina * porPagina + 1
    const hasta = Math.min(total, desde + porPagina - 1)
    return `Mostrando ${desde}–${hasta} de ${total} ${total === 1 ? 'producto' : 'productos'}`
}
