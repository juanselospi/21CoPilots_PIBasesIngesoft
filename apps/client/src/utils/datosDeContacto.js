// Ayudas para el formulario de contacto de Mi cuenta (direccion y telefonos).
// useFormulario trabaja con campos sueltos, por eso cada telefono va en su propio campo: telefono0, telefono1...
import { reglasTelefono } from './reglasCliente.js'

// Es el maximo que acepta el servidor
export const MAXIMO_TELEFONOS = 5
export const LIMITE_DIRECCION = 500

export const campoTelefono = (indice) => `telefono${indice}`

// Siempre hay al menos un campo de telefono aunque la cuenta no traiga ninguno
export const cantidadDeTelefonos = (cuenta) => Math.max(1, cuenta.telefonos?.length ?? 0)

// Valores iniciales del formulario a partir de lo que devuelve el servidor
export function valoresDeContacto(cuenta) {
    const valores = { direccion: cuenta.direccion ?? '' }
    for (let i = 0; i < MAXIMO_TELEFONOS; i++) {
        valores[campoTelefono(i)] = cuenta.telefonos?.[i] ?? ''
    }
    return valores
}

// Reglas para validarCampos, solo de los telefonos que se ven en pantalla
export function definicionDeContacto(cantidad) {
    const definicion = { direccion: { obligatorio: true } }
    for (let i = 0; i < cantidad; i++) {
        definicion[campoTelefono(i)] = { obligatorio: true, ...reglasTelefono }
    }
    return definicion
}

// Lo que hay que mandarle al servidor: solo los campos que cambiaron, si no cambio nada queda vacio
export function cambiosDeContacto(valores, cantidad, cuenta) {
    const cambios = {}

    const direccion = valores.direccion.trim()
    if (direccion !== (cuenta.direccion ?? '')) cambios.direccion = direccion

    const telefonos = Array.from({ length: cantidad }, (_, i) => valores[campoTelefono(i)].trim())
    if (telefonos.join(',') !== (cuenta.telefonos ?? []).join(',')) cambios.telefonos = telefonos

    return cambios
}

// El servidor marca "telefonos" como un solo campo -> se muestra en el primer telefono
export const camposDelServidor = (campos = []) =>
    campos.map((campo) => (campo === 'telefonos' ? campoTelefono(0) : campo))
