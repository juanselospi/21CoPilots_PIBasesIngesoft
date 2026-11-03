import assert from 'node:assert/strict'
import test from 'node:test'
import { rutaDeVuelta } from './rutaDeVuelta.js'

test('acepta rutas de la tienda', () => {
    for (const ruta of ['/', '/carrito', '/checkout?paso=2', '/producto/PS5-001']) {
        assert.equal(rutaDeVuelta(ruta), ruta)
    }
})

test('rechaza otros sitios y valores raros', () => {
    for (const ruta of [null, undefined, '', 'carrito', 'https://otro.com', '//otro.com', '/\\otro.com', 'javascript:alert(1)']) {
        assert.equal(rutaDeVuelta(ruta), null, String(ruta))
    }
})
