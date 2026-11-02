// Cliente HTTP: el único lugar del cliente que habla con la red
// Las rutas van a /api, que Vite reenvía al servidor, así viaja la cookie de sesión.

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.'
const MENSAJE_POR_DEFECTO = 'Ocurrió un error inesperado. Intente de nuevo.'

// Funciones que se llaman cuando el servidor ya no reconoce la sesión, por ahora solo la usa SessionProvider
const oyentesDeSesion = new Set()

/**
 * Avisa cuando el servidor responde 401 porque no hay sesión.
 * Una contraseña incorrecta también da 401 pero con otro código, así que esa no avisa.
 * Devuelve la función para dejar de escuchar.
 */
export function alPerderSesion(oyente) {
    oyentesDeSesion.add(oyente)
    return () => {
        oyentesDeSesion.delete(oyente)
    }
}

// Error que respondió el servidor, con su estado HTTP, código y detalles (p. ej. campos inválidos).
export class ErrorHttp extends Error {
    constructor(mensaje, { estado, codigo = null, detalles = null }) {
        super(mensaje)
        this.name = 'ErrorHttp'
        this.estado = estado
        this.codigo = codigo
        this.detalles = detalles
    }
}

/**
 * Hace la petición y devuelve el campo `datos` de la respuesta.
 * Si algo sale mal lanza un Error.
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
        if (respuesta.status === 401 && contenido?.error?.codigo === 'NO_AUTENTICADO') {
            oyentesDeSesion.forEach((oyente) => oyente())
        }
        throw new ErrorHttp(contenido?.error?.mensaje ?? MENSAJE_POR_DEFECTO, {
            estado: respuesta.status,
            codigo: contenido?.error?.codigo ?? null,
            detalles: contenido?.error?.detalles ?? null,
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
