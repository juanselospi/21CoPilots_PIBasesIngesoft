// Llamadas al servidor para los clientes.

import { pedir } from './clienteHttp.js'

/**
 * Crea la cuenta del cliente y deja la sesión iniciada (el servidor manda la cookie, igual que al iniciar sesión).
 * Si el correo o la cédula ya tienen cuenta el servidor responde 409 y dice cuál campo en `detalles.campos`.
 */
export function registrarCliente({ nombre, correo, contrasena, cedula, telefono, direccion }) {
    return pedir('/api/clientes', {
        metodo: 'POST',
        cuerpo: { nombre, correo, contrasena, cedula, telefono, direccion, aceptaTerminos: true },
    })
}
