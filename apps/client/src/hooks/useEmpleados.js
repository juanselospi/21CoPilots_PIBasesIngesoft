import { listarEmpleados } from '../api/empleados.js'
import { useRecursoRemoto } from './useRecursoRemoto.js'

// Cuentas de administrador: [{ correo, nombre, esPropietario, activo, creadoPor }]
export function useEmpleados() {
    return useRecursoRemoto((signal) => listarEmpleados({ signal }), [])
}
