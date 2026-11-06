// Llamadas al servidor para las cuentas de empleados. Solo las puede usar el propietario.

import { pedir } from './clienteHttp.js'

// Todas las cuentas de administrador: el propietario primero y después los empleados por nombre
export function listarEmpleados({ signal } = {}) {
    return pedir('/api/admin/usuarios', { signal })
}

// Si el correo ya tiene una cuenta o algún dato no sirve, el servidor indica los campos en `detalles.campos`
export function crearEmpleado({ nombre, correo, contrasena }) {
    return pedir('/api/admin/usuarios', { metodo: 'POST', cuerpo: { nombre, correo, contrasena } })
}

// Al desactivar una cuenta el servidor cierra sus sesiones
export function cambiarActivoEmpleado(correo, activo) {
    return pedir(`/api/admin/usuarios/${encodeURIComponent(correo)}/activo`, { metodo: 'PATCH', cuerpo: { activo } })
}
