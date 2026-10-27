// Existencias de los modales de agregar y editar producto.

// Solo dígitos: las existencias son unidades enteras
export const readStockInput = (input) => (/^\d*$/.test(input) ? input : null)
