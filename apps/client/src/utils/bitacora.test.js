import assert from 'node:assert/strict'
import test from 'node:test'
import { cambioDeFecha, detalleDelValor, leerConsultaDeBitacora, nombreDeEntidad } from './bitacora.js'

const textos = (valor) => detalleDelValor(valor).map(({ etiqueta, texto }) => `${etiqueta}: ${texto}`)

test('un cambio de margen se lee con sus nombres y porcentajes', () => {
    assert.deepEqual(textos({ porcentajeImportacion: 20, margenGanancia: 25 }), ['Importación: 20 %', 'Margen: 25 %'])
})

test('los estados se leen igual que en el resto del panel', () => {
    assert.deepEqual(textos({ estado: 'finalizado' }), ['Estado: Entregado'])
    assert.deepEqual(textos({ estado: 'en_transito' }), ['Estado: En tránsito'])
    assert.deepEqual(textos({ estado: 'descontinuado' }), ['Estado: Descontinuado'])
    assert.deepEqual(textos({ activo: false }), ['Estado: Inactivo'])
})

test('los valores que el servidor guarda como código se leen en palabras', () => {
    assert.deepEqual(textos({ tipo: 'venta_en_linea' }), ['Tipo: Venta en línea'])
    assert.deepEqual(textos({ metodoPago: 'sinpe_movil' }), ['Medio de pago: SINPE Móvil'])
    assert.deepEqual(textos({ canal: 'telefono' }), ['Canal: Teléfono'])
    assert.deepEqual(textos({ pago: 'aprobado' }), ['Pago: Aprobado'])
})

test('sin valor no hay nada que mostrar', () => {
    assert.deepEqual(detalleDelValor(null), [])
    assert.deepEqual(detalleDelValor(undefined), [])
})

test('se omite lo vacío y lo que la fila ya muestra', () => {
    assert.deepEqual(
        textos({ sku: 'LEG-001', cantidad: 3, motivo: null, fecha: '2026-11-03T18:00:00Z', correoAdministrador: 'a@b.test' }),
        ['Código: LEG-001', 'Cantidad: 3'],
    )
})

test('los campos sin nombre propio se leen en palabras, sin perder el dato', () => {
    assert.deepEqual(textos({ campoNuevoRaro: 7 }), ['Campo nuevo raro: 7'])
    assert.deepEqual(textos({ lista: { a: 1 } }), ['Lista: {"a":1}'])
    assert.deepEqual(textos({ sinCuenta: true }), ['Sin cuenta: Sí'])
})

test('las unidades repuestas de una cancelación se listan', () => {
    assert.deepEqual(textos({ unidadesRepuestas: [{ sku: 'A', cantidad: 2 }, { sku: 'B', cantidad: 1 }] }), ['Unidades repuestas: 2 × A, 1 × B'])
    assert.deepEqual(textos({ unidadesRepuestas: [] }), ['Unidades repuestas: Ninguna'])
})

test('una entidad desconocida se muestra tal cual', () => {
    assert.equal(nombreDeEntidad('administrador'), 'Empleado')
    assert.equal(nombreDeEntidad('otra'), 'otra')
})

test('la consulta ignora lo que no reconoce en la URL', () => {
    const leer = (texto) => leerConsultaDeBitacora(new URLSearchParams(texto))
    assert.deepEqual(leer('evento=acceso_denegado&desde=2026-11-01&hasta=2026-11-03&pagina=2'), {
        evento: 'acceso_denegado', desde: '2026-11-01', hasta: '2026-11-03', pagina: 2,
    })
    assert.deepEqual(leer('evento=inventado&desde=ayer&hasta=2026-13-45&pagina=-1'), { evento: '', desde: '', hasta: '', pagina: 0 })
    assert.equal(leer('evento=toString').evento, '')
})

test('un rango al revés en la URL no llega al servidor', () => {
    const { desde, hasta } = leerConsultaDeBitacora(new URLSearchParams('desde=2026-11-05&hasta=2026-11-01'))
    assert.equal(desde, '2026-11-05')
    assert.equal(hasta, '')
})

test('cambiar una fecha quita la otra solo si el rango queda al revés', () => {
    const rango = { desde: '2026-11-03', hasta: '2026-11-10' }
    assert.deepEqual(cambioDeFecha(rango, 'desde', '2026-11-05'), { desde: '2026-11-05' })
    assert.deepEqual(cambioDeFecha(rango, 'desde', '2026-11-20'), { desde: '2026-11-20', hasta: '' })
    assert.deepEqual(cambioDeFecha(rango, 'hasta', '2026-11-05'), { hasta: '2026-11-05' })
    assert.deepEqual(cambioDeFecha(rango, 'hasta', '2026-11-01'), { hasta: '2026-11-01', desde: '' })
    assert.deepEqual(cambioDeFecha(rango, 'hasta', ''), { hasta: '' })
    // El mismo día es un rango válido: el servidor incluye todo el día de «hasta»
    assert.deepEqual(cambioDeFecha(rango, 'hasta', '2026-11-03'), { hasta: '2026-11-03' })
})
