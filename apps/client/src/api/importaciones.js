// Llamadas al servidor para importar el Excel de productos.
// Van a /api, que Vite reenvía al servidor, así viaja la cookie de sesión.

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

    let response
    try {
        response = await fetch('/api/admin/importaciones', { method: 'POST', body: form })
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.')
    }

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        // Los 400 traen un mensaje pensado para el usuario (archivo muy grande,
        // no es .xlsx, faltan columnas...). Para lo demás usamos uno propio.
        const serverMessage = response.status === 400 ? body?.error?.mensaje : null
        throw new Error(
            messagesByStatus[response.status] ??
            serverMessage ??
            'No se pudo importar el archivo. No se guardó ningún producto.'
        )
    }

    return body.datos
}
