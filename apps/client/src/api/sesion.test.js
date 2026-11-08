import assert from 'node:assert/strict'
import test from 'node:test'
import { logIn } from './sesion.js'

const responder = (status, cuerpo) => {
    globalThis.fetch = async () => new Response(JSON.stringify(cuerpo), { status })
}

test('iniciar sesión devuelve el usuario y manda los datos por POST', async () => {
    let pedido
    globalThis.fetch = async (ruta, opciones) => {
        pedido = { ruta, opciones }
        return new Response(JSON.stringify({ datos: { correo: 'ana@correo.test', rol: 'cliente' } }), { status: 200 })
    }

    assert.deepEqual(await logIn('ana@correo.test', 'Clave123!'), { correo: 'ana@correo.test', rol: 'cliente' })
    assert.equal(pedido.ruta, '/api/admin/sesion')
    assert.equal(pedido.opciones.method, 'POST')
    assert.deepEqual(JSON.parse(pedido.opciones.body), { correo: 'ana@correo.test', contrasena: 'Clave123!' })
})

test('credenciales malas salen con el mensaje propio y conservan el código', async () => {
    responder(401, { error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'texto del servidor' } })

    await assert.rejects(logIn('a', 'b'), (error) => {
        assert.equal(error.message, 'Correo o contraseña incorrectos.')
        assert.equal(error.estado, 401)
        assert.equal(error.codigo, 'CREDENCIALES_INVALIDAS')
        return true
    })
})

test('otro error del servidor sale con el mensaje genérico de inicio de sesión', async () => {
    responder(500, { error: { codigo: 'ERROR_INTERNO', mensaje: 'texto del servidor' } })

    await assert.rejects(logIn('a', 'b'), { message: 'No se pudo iniciar sesión. Intente de nuevo en unos minutos.' })
})

test('sin conexión avisa que no se pudo conectar', async () => {
    globalThis.fetch = async () => {
        throw new TypeError('failed to fetch')
    }

    await assert.rejects(logIn('a', 'b'), { message: 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.' })
})
