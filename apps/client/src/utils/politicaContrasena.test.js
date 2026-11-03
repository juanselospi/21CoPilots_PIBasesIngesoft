import assert from 'node:assert/strict'
import test from 'node:test'
import { reglasContrasena, requisitosContrasena } from './politicaContrasena.js'
import { validarCampos } from './validarCampos.js'

const cumple = (contrasena) => !validarCampos({ contrasena }, { contrasena: reglasContrasena }).contrasena

test('acepta contraseñas de 8 a 12 caracteres con mayúscula, número y especial', () => {
    for (const contrasena of ['Clave#20', 'Clave#2026ab', 'Ñandú_2026']) {
        assert.ok(cumple(contrasena), contrasena)
    }
})

test('rechaza las que no cumplen un requisito', () => {
    for (const contrasena of ['Cl#2026', 'Clave#2026abc', 'clave#2026', 'Clave#clave', 'Clave2026']) {
        assert.ok(!cumple(contrasena), contrasena)
    }
})

test('el patrón único coincide con la lista de requisitos que ve el usuario', () => {
    for (const contrasena of ['Clave#20', 'clave#2026', 'Clave2026', 'Cl#2026', 'Ñandú_2026']) {
        const todos = requisitosContrasena.every(({ patron }) => patron.test(contrasena))
        assert.equal(cumple(contrasena), todos, contrasena)
    }
})
