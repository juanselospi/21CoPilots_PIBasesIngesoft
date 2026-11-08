// Llamadas al servidor para la sesión del usuario.
// Van a /api, que Vite reenvía al servidor, así la cookie queda en el mismo origen.

import { ErrorHttp, pedir } from './clienteHttp.js'

const messagesByStatus = {
    400: 'Escriba su correo y contraseña.',
    401: 'Correo o contraseña incorrectos.',
}

/**
 * Inicia sesión y devuelve los datos del usuario.
 * El servidor deja la cookie de sesión en la respuesta.
 * Si algo sale mal lanza un Error.
 */
export async function logIn(correo, contrasena) {
    try {
        return await pedir('/api/admin/sesion', { metodo: 'POST', cuerpo: { correo, contrasena } })
    } catch (error) {
        if (!(error instanceof ErrorHttp)) throw error
        // Aquí el mensaje del servidor no sirve, lo que se le muestra al usuario sale de la tabla de arriba
        throw new ErrorHttp(
            messagesByStatus[error.estado] ?? 'No se pudo iniciar sesión. Intente de nuevo en unos minutos.',
            { estado: error.estado, codigo: error.codigo, detalles: error.detalles },
        )
    }
}

// Cierra la sesión, el servidor la borra y quita la cookie
export function logOut() {
    return pedir('/api/admin/sesion', { metodo: 'DELETE' })
}

/**
 * Cambia la contraseña del usuario que tiene la sesión.
 * Si la actual está mal el servidor responde 400 y marca `contrasenaActual` en `detalles.campos`.
 */
export function cambiarContrasena(contrasenaActual, contrasenaNueva) {
    return pedir('/api/admin/contrasena', {
        metodo: 'PATCH',
        cuerpo: { contrasenaActual, contrasenaNueva },
    })
}

// Pide el enlace para restablecer la contraseña. El servidor responde igual exista o no el correo
export function pedirEnlaceDeRecuperacion(correo) {
    return pedir('/api/admin/contrasena/recuperacion', { metodo: 'POST', cuerpo: { correo } })
}

/**
 * Cambia la contraseña con el token que llegó en el enlace del correo.
 * Si el token no sirve (vencido, ya usado o inventado) el servidor responde 400 con el código TOKEN_INVALIDO.
 */
export function restablecerContrasena(token, contrasenaNueva) {
    return pedir('/api/admin/contrasena/restablecimiento', {
        metodo: 'POST',
        cuerpo: { token, contrasenaNueva },
    })
}

// Devuelve el usuario de la cookie, o null si no hay sesion.
export async function getSession({ signal } = {}) {
    try {
        return await pedir('/api/admin/sesion', { signal })
    } catch (error) {
        if (error instanceof ErrorHttp && error.estado === 401) return null
        throw error
    }
}
