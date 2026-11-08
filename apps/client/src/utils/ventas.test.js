import assert from 'node:assert/strict'
import test from 'node:test'
import { validarCampos } from './validarCampos.js'
import {
    CANALES_DE_VENTA, VENTA_VACIA, agregarALaVenta, avisoDeExistenciasBajas, camposDelFormulario, cuerpoDeLaVenta,
    mensajeDeVenta, reglasDeVenta, totalDeLaVenta, unidadesQueQuedan,
} from './ventas.js'

const producto = (extra = {}) => ({
    sku: 'A', nombre: 'Halcón', precioFinal: 10, existencias: 5, admiteContrapedido: false, ...extra,
})

test('la venta no ofrece el canal de la tienda en línea', () => {
    assert.deepEqual(CANALES_DE_VENTA.map(({ value }) => value), ['whatsapp', 'facebook', 'telefono', 'presencial'])
})

test('agregar suma las cantidades del mismo producto en una sola línea', () => {
    const { lineas } = agregarALaVenta([], producto(), 2)
    const siguiente = agregarALaVenta(lineas, producto(), 3)
    assert.equal(siguiente.lineas.length, 1)
    assert.equal(siguiente.lineas[0].cantidad, 5)
})

test('no deja vender más de lo que hay, contando lo que ya va en la venta', () => {
    assert.equal(agregarALaVenta([], producto(), 6).problema, 'Solo hay 5 unidades.')
    const { lineas } = agregarALaVenta([], producto(), 4)
    assert.equal(agregarALaVenta(lineas, producto(), 2).problema, 'Solo hay 5 unidades y ya van 4 en la venta.')
})

test('con contrapedido se puede pasar de las existencias, hasta el máximo por producto', () => {
    const conContrapedido = producto({ admiteContrapedido: true, existencias: 0 })
    assert.equal(agregarALaVenta([], conContrapedido, 3).lineas[0].cantidad, 3)
    assert.match(agregarALaVenta([], conContrapedido, 1000).problema, /máxima/)
})

test('el total lleva cada línea redondeada y el envío', () => {
    const lineas = [{ precioFinal: 6.78, cantidad: 3 }, { precioFinal: 16.37, cantidad: 2 }]
    assert.equal(totalDeLaVenta(lineas), 53.08)
    assert.equal(totalDeLaVenta(lineas, 3.5), 56.58)
})

test('las existencias no quedan negativas', () => {
    assert.equal(unidadesQueQuedan({ existencias: 5, cantidad: 2 }), 3)
    assert.equal(unidadesQueQuedan({ existencias: 1, cantidad: 4 }), 0)
})

test('todos los errores salen a la vez y lo obligatorio depende del cliente y la modalidad', () => {
    const faltantes = (opciones) => Object.keys(validarCampos(VENTA_VACIA, reglasDeVenta(opciones)))
    assert.deepEqual(faltantes({ sinCuenta: false, exigeDireccion: false }), ['correoCliente', 'canal', 'modalidadEntrega', 'metodoPago'])
    assert.deepEqual(faltantes({ sinCuenta: true, exigeDireccion: true }), ['nombre', 'canal', 'modalidadEntrega', 'direccion', 'metodoPago'])
})

test('el teléfono de alguien sin cuenta es opcional, pero con formato', () => {
    const reglas = reglasDeVenta({ sinCuenta: true, exigeDireccion: false })
    assert.equal(validarCampos({ ...VENTA_VACIA }, reglas).telefono, undefined)
    assert.match(validarCampos({ ...VENTA_VACIA, telefono: '123' }, reglas).telefono, /8 dígitos/)
})

test('el cuerpo manda un cliente o el otro, y la dirección solo si hace falta', () => {
    const valores = { ...VENTA_VACIA, correoCliente: 'a@b.cr', nombre: ' Ana ', telefono: '', canal: 'presencial', direccion: ' San José ' }
    const lineas = [{ sku: 'A', nombre: 'Halcón', cantidad: 2, precioFinal: 1, existencias: 3 }]

    const conCuenta = cuerpoDeLaVenta(valores, lineas, { sinCuenta: false, exigeDireccion: true })
    assert.equal(conCuenta.correoCliente, 'a@b.cr')
    assert.equal(conCuenta.clienteNuevo, undefined)
    assert.equal(conCuenta.direccion, 'San José')
    assert.deepEqual(conCuenta.lineas, [{ sku: 'A', cantidad: 2 }])

    const sinCuenta = cuerpoDeLaVenta(valores, lineas, { sinCuenta: true, exigeDireccion: false })
    assert.deepEqual(sinCuenta.clienteNuevo, { nombre: 'Ana', telefono: undefined })
    assert.equal(sinCuenta.correoCliente, undefined)
    assert.equal(sinCuenta.direccion, undefined)
})

test('los campos del servidor se traducen a los del formulario', () => {
    assert.deepEqual(camposDelFormulario(['clienteNuevo.nombre', 'canal', 'lineas']), ['nombre', 'canal'])
})

test('el mensaje dice cuántas unidades quedan', () => {
    assert.equal(mensajeDeVenta([{ nombre: 'A', existencias: 12, cantidad: 2 }]), 'Venta registrada. Quedan 10 unidades.')
    assert.equal(mensajeDeVenta([{ nombre: 'A', existencias: 2, cantidad: 1 }]), 'Venta registrada. Queda 1 unidad.')
    assert.equal(
        mensajeDeVenta([{ nombre: 'A', existencias: 5, cantidad: 1 }, { nombre: 'B', existencias: 3, cantidad: 3 }]),
        'Venta registrada. Quedan 4 de A, 0 de B.',
    )
})

test('solo avisa de existencias bajas en lo que se vendió', () => {
    const lineas = [{ sku: 'A' }]
    assert.equal(avisoDeExistenciasBajas(lineas, [{ sku: 'Z', nombre: 'Otro', existencias: 1 }]), null)
    assert.equal(
        avisoDeExistenciasBajas(lineas, [{ sku: 'A', nombre: 'Halcón', existencias: 2 }]),
        'Quedan 2 de Halcón: se generó una alerta de existencias bajas.',
    )
})
