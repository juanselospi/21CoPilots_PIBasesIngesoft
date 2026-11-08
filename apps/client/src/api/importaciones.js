// Llamadas al servidor para importar el Excel de productos.

import { ErrorHttp, pedir } from './clienteHttp.js'

export const TEMPLATE_URL = '/api/admin/importaciones/plantilla'

const messagesByStatus = {
    401: 'Su sesión venció o no ha iniciado sesión. Ingrese de nuevo como administrador.',
    403: 'Solo el administrador puede importar productos.',
}

/**
 * Sube el Excel y devuelve el resumen:
 * { leidas, importadas, actualizadas, rechazadas, reporte }.
 * Si algo sale mal lanza un Error con un mensaje para mostrar tal cual.
 */
export async function importProducts(file) {
    const form = new FormData()
    form.append('archivo', file)

    try {
        return await pedir('/api/admin/importaciones', { metodo: 'POST', cuerpo: form })
    } catch (error) {
        if (!(error instanceof ErrorHttp)) throw error
        // Los 400 traen un mensaje pensado para el usuario (archivo muy grande,
        // no es .xlsx, faltan columnas...). Para lo demás usamos uno propio.
        throw new Error(
            messagesByStatus[error.estado] ??
            (error.estado === 400 ? error.message : 'No se pudo importar el archivo. No se guardó ningún producto.'),
            { cause: error },
        )
    }
}
