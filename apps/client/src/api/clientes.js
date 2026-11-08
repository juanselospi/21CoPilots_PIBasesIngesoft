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

// Datos de la cuenta del cliente con sesión: nombre, correo, cédula, dirección y teléfonos.
export function obtenerMiCuenta({ signal } = {}) {
    return pedir('/api/clientes/me', { signal })
}

/**
 * Cambia la dirección o los teléfonos del cliente con sesión, solo se manda lo que cambió.
 * Devuelve la cuenta como quedó, con los teléfonos ya en formato 8888-8888 y sin repetidos.
 */
export function corregirMiCuenta(cambios) {
    return pedir('/api/clientes/me', { metodo: 'PATCH', cuerpo: cambios })
}

// Clientes por nombre, correo o cédula para el panel: [{ correo, nombre, cedula }], hasta 8.
export function buscarClientesAdmin(q, { signal } = {}) {
    return pedir('/api/clientes/admin', { parametros: { q }, signal })
}
