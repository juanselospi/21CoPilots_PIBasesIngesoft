import assert from 'node:assert/strict'
import test from 'node:test'
import { guardarPendiente, tomarPendiente } from './carritoPendiente.js'

const AHORA = Date.UTC(2026, 10, 10, 12)

function crearAlmacen() {
    const datos = new Map()
    return {
        getItem: (clave) => datos.get(clave) ?? null,
        setItem: (clave, valor) => datos.set(clave, valor),
        removeItem: (clave) => datos.delete(clave),
        datos,
    }
}

test('pendiente: lo que se guarda sin sesión se toma una sola vez', () => {
    const almacen = crearAlmacen()
    guardarPendiente('FUN-005', 2, { almacen, ahora: AHORA })

    assert.deepEqual(tomarPendiente({ almacen, ahora: AHORA + 60000 }), { sku: 'FUN-005', cantidad: 2 })
    assert.equal(tomarPendiente({ almacen, ahora: AHORA + 60000 }), null)
})

test('pendiente: el último producto reemplaza al anterior', () => {
    const almacen = crearAlmacen()
    guardarPendiente('FUN-005', 1, { almacen, ahora: AHORA })
    guardarPendiente('JUG-002', 3, { almacen, ahora: AHORA })

    assert.deepEqual(tomarPendiente({ almacen, ahora: AHORA }), { sku: 'JUG-002', cantidad: 3 })
})

test('pendiente: después de una hora ya no se agrega y se borra igual', () => {
    const almacen = crearAlmacen()
    guardarPendiente('FUN-005', 1, { almacen, ahora: AHORA })

    assert.equal(tomarPendiente({ almacen, ahora: AHORA + 61 * 60000 }), null)
    assert.equal(almacen.datos.size, 0)
})

test('pendiente: lo que no se entiende o no hay almacenamiento no rompe nada', () => {
    const almacen = crearAlmacen()
    almacen.setItem('dchobbies:carrito-pendiente', '{roto')

    assert.equal(tomarPendiente({ almacen, ahora: AHORA }), null)
    assert.equal(tomarPendiente({ almacen: null, ahora: AHORA }), null)
    assert.doesNotThrow(() => guardarPendiente('FUN-005', 1, { almacen: null }))
})
