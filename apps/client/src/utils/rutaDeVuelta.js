// Ruta a la que se regresa despues de iniciar sesion o crear la cuenta, por ejemplo ?volver=/carrito.
// Solo se aceptan rutas de la misma tienda, asi un enlace armado no puede mandar al usuario a otro sitio
export function rutaDeVuelta(volver) {
    if (typeof volver !== 'string' || !volver.startsWith('/')) return null
    // "//otro.com" y "/\otro.com" el navegador los toma como otro dominio
    if (volver.startsWith('//') || volver.startsWith('/\\')) return null
    return volver
}
