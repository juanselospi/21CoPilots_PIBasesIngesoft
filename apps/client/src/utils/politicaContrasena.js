// Politica de contraseñas que pidio el cliente. El servidor la vuelve a validar, esto es solo para avisar antes
// Con \p{Lu} la Ñ y las vocales con tilde cuentan como mayuscula, y cualquier cosa que no sea letra ni numero es especial
export const requisitosContrasena = [
    { texto: 'Entre 8 y 12 caracteres', patron: /^.{8,12}$/u },
    { texto: 'Una letra mayúscula', patron: /\p{Lu}/u },
    { texto: 'Un número', patron: /\d/ },
    { texto: 'Un carácter especial (# o !)', patron: /[^\p{L}\p{N}]/u },
]

// La misma politica en un solo patron para usarla con validarCampos
export const reglasContrasena = {
    patron: /^(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\p{N}]).{8,12}$/u,
    mensajePatron: 'La contraseña no cumple los requisitos.',
}
