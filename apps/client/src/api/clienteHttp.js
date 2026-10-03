// Cliente HTTP: el único lugar del cliente que habla con la red (arquitectura.md § 11.1).
// Las rutas van a /api, que Vite reenvía al servidor, así viaja la cookie de sesión.

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.'
const MENSAJE_POR_DEFECTO = 'Ocurrió un error inesperado. Intente de nuevo.'

/** Respuesta del servidor que no fue 2xx. Trae el estado HTTP y el código de error del servidor. */
export class ErrorHttp extends Error {
    constructor(mensaje, { estado, codigo = null }) {
        super(mensaje)
        this.name = 'ErrorHttp'
        this.estado = estado
        this.codigo = codigo
    }
}

/**
 * Hace la petición y devuelve el campo `datos` de la respuesta.
 * - `parametros` va en la consulta; los valores vacíos no viajan.
 * - `cuerpo` se envía como JSON, o tal cual si es un FormData.
 * - `conMeta` devuelve { datos, meta }, para las listas paginadas que traen
 *   el total en `meta`.
 * Si algo sale mal lanza un Error con un mensaje para mostrar tal cual; si el
 * servidor respondió con error, es un ErrorHttp. Si se cancela con `signal`,
 * deja pasar el AbortError para que quien pidió sepa que no es un fallo.
 */
export async function pedir(ruta, { metodo = 'GET', parametros, cuerpo, signal, conMeta = false } = {}) {
    const opciones = { method: metodo, signal }
    if (cuerpo instanceof FormData) {
        opciones.body = cuerpo
    } else if (cuerpo !== undefined) {
        opciones.headers = { 'Content-Type': 'application/json' }
        opciones.body = JSON.stringify(cuerpo)
    }

    let respuesta
    try {
        respuesta = await fetch(conParametros(ruta, parametros), opciones)
    } catch (error) {
        if (error.name === 'AbortError') throw error
        throw new Error(MENSAJE_SIN_CONEXION, { cause: error })
    }

    const contenido = await respuesta.json().catch(() => null)

    if (!respuesta.ok) {
        throw new ErrorHttp(contenido?.error?.mensaje ?? MENSAJE_POR_DEFECTO, {
            estado: respuesta.status,
            codigo: contenido?.error?.codigo ?? null,
        })
    }

    return conMeta ? { datos: contenido?.datos, meta: contenido?.meta } : contenido?.datos
}

function conParametros(ruta, parametros = {}) {
    const consulta = new URLSearchParams()
    for (const [nombre, valor] of Object.entries(parametros)) {
        if (valor !== undefined && valor !== null && valor !== '') consulta.append(nombre, valor)
    }
    const texto = consulta.toString()
    return texto ? `${ruta}?${texto}` : ruta
}
