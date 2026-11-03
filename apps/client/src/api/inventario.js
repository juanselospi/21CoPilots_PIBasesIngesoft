// Llamadas al servidor para el inventario. Todas son del administrador.

import { pedir } from './clienteHttp.js'

// Productos activos con existencias en el umbral o por debajo, los más urgentes primero (RF-16).
// Devuelve { datos, meta }; meta trae el umbral y el total.
export function listarAlertas({ signal } = {}) {
    return pedir('/api/inventario/alertas', { signal, conMeta: true })
}

// Registra mercancía que llegó: { sku, cantidad > 0, costoUnitario } (RF-13, RF-14).
// Devuelve el movimiento con las existencias que quedaron.
export function registrarIngreso(ingreso, { signal } = {}) {
    return pedir('/api/inventario/ingresos', { metodo: 'POST', cuerpo: ingreso, signal })
}

// Suma (cantidad positiva) o resta (negativa) unidades con un motivo: { sku, cantidad, motivo } (RF-20).
// Si dejaría las existencias en negativo, el servidor responde 409.
export function registrarAjuste(ajuste, { signal } = {}) {
    return pedir('/api/inventario/ajustes', { metodo: 'POST', cuerpo: ajuste, signal })
}

// Historial de movimientos, los más recientes primero (RF-19). `limite` es 25, 50 o 100.
// Devuelve { datos, meta } con el total para paginar.
export function listarMovimientos({ sku, tipo, desde, hasta, pagina, limite } = {}, { signal } = {}) {
    return pedir('/api/inventario/movimientos', {
        parametros: { sku, tipo, desde, hasta, pagina, limite },
        signal,
        conMeta: true,
    })
}
