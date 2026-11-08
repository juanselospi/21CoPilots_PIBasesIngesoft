import assert from 'node:assert/strict'
import test from 'node:test'
import { importProducts } from './importaciones.js'

const archivo = new File(['x'], 'productos.xlsx')
const responder = (status, cuerpo) => {
    globalThis.fetch = async () => new Response(JSON.stringify(cuerpo), { status })
}

test('sube el archivo como FormData y devuelve el resumen', async () => {
    let opciones
    globalThis.fetch = async (_ruta, recibidas) => {
        opciones = recibidas
        return new Response(JSON.stringify({ datos: { leidas: 2, importadas: 2 } }), { status: 201 })
    }

    assert.deepEqual(await importProducts(archivo), { leidas: 2, importadas: 2 })
    assert.ok(opciones.body instanceof FormData)
    assert.equal(opciones.body.get('archivo').name, 'productos.xlsx')
    // El navegador tiene que poner el Content-Type con el boundary
    assert.equal(opciones.headers, undefined)
})

test('un 400 muestra el mensaje del servidor', async () => {
    responder(400, { error: { codigo: 'ENTRADA_INVALIDA', mensaje: 'Faltan columnas.' } })
    await assert.rejects(importProducts(archivo), { message: 'Faltan columnas.' })
})

test('401, 403 y otros errores usan los mensajes propios', async () => {
    responder(401, { error: { codigo: 'NO_AUTENTICADO', mensaje: 'x' } })
    await assert.rejects(importProducts(archivo), /Su sesión venció/)

    responder(403, { error: { codigo: 'NO_AUTORIZADO', mensaje: 'x' } })
    await assert.rejects(importProducts(archivo), { message: 'Solo el administrador puede importar productos.' })

    responder(500, { error: { codigo: 'ERROR_INTERNO', mensaje: 'x' } })
    await assert.rejects(importProducts(archivo), { message: 'No se pudo importar el archivo. No se guardó ningún producto.' })
})
