// Llamadas al servidor para el inventario. Todas son del administrador.

import { pedir } from './clienteHttp.js'

// Productos activos con existencias en el umbral o por debajo, los más urgentes primero (RF-16).
// Devuelve { datos, meta }; meta trae el umbral y el total.
export function listarAlertas({ signal } = {}) {
    return pedir('/api/inventario/alertas', { signal, conMeta: true })
}
