// Lo que un visitante quiso agregar al carrito antes de iniciar sesion. Se guarda en el navegador
// para agregarlo cuando entre, aunque cree la cuenta o tarde en volver

const CLAVE = 'dchobbies:carrito-pendiente'
// Despues de una hora ya no se agrega: seria de una visita vieja y sorprenderia
const VIGENCIA_MS = 60 * 60 * 1000

const almacenDelNavegador = () => globalThis.localStorage ?? null

export function guardarPendiente(sku, cantidad, { almacen = almacenDelNavegador(), ahora = Date.now() } = {}) {
    try {
        almacen?.setItem(CLAVE, JSON.stringify({ sku, cantidad, guardadoEn: ahora }))
    } catch {
        // Sin almacenamiento (modo privado o lleno) solo se pierde esta comodidad
    }
}

// Lo devuelve y lo borra, asi no se agrega dos veces. null si no hay o ya vencio
export function tomarPendiente({ almacen = almacenDelNavegador(), ahora = Date.now() } = {}) {
    try {
        const texto = almacen?.getItem(CLAVE)
        almacen?.removeItem(CLAVE)
        if (!texto) return null

        const { sku, cantidad, guardadoEn } = JSON.parse(texto)
        const valido = typeof sku === 'string' && Number.isInteger(cantidad) && cantidad > 0
        return valido && ahora - guardadoEn < VIGENCIA_MS ? { sku, cantidad } : null
    } catch {
        return null
    }
}
