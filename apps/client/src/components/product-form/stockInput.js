// Existencias de los modales de agregar y editar producto.

// Solo dígitos: las existencias son unidades enteras
export const readStockInput = (input) => (/^\d*$/.test(input) ? input : null)

// Error del campo de existencias; si es opcional puede quedar vacío (vale 0)
export const validateStock = (values, optional = false) => {
    if (values.stock === '' && !optional) return { stock: 'Ingrese una cantidad.' }
    return {}
}
