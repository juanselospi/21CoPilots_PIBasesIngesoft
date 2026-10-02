// Llamadas al servidor para la sesión del usuario.
// Van a /api, que Vite reenvía al servidor, así la cookie queda en el mismo origen.

import { ErrorHttp, pedir } from './clienteHttp.js'

const messagesByStatus = {
    400: 'Escriba su correo y contraseña.',
    401: 'Correo o contraseña incorrectos.',
}

/**
 * Inicia sesión y devuelve el usuario: { id, correo, nombre, rol }.
 * El servidor deja la cookie de sesión en la respuesta.
 * Si algo sale mal lanza un Error con un mensaje para mostrar tal cual.
 */
export async function logIn(correo, contrasena) {
    let response
    try {
        response = await fetch('/api/admin/sesion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena }),
        })
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.')
    }

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            messagesByStatus[response.status] ??
            'No se pudo iniciar sesión. Intente de nuevo en unos minutos.'
        )
    }

    return body.datos
}

// Devuelve el usuario de la cookie: { correo, nombre, rol }, o null si no hay sesion.
export async function getSession({ signal } = {}) {
    try {
        return await pedir('/api/admin/sesion', { signal })
    } catch (error) {
        if (error instanceof ErrorHttp && error.estado === 401) return null
        throw error
    }
}
