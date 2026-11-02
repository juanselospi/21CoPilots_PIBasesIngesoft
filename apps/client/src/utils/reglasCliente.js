// Formatos de los datos de contacto del cliente, para el registro y para corregirlos despues.
// El servidor los vuelve a revisar y guarda la cedula en un solo formato

// 8 digitos de Costa Rica, con o sin guion o espacio en el medio: 8888-8888
export const reglasTelefono = {
    patron: /^\d{4}[- ]?\d{4}$/,
    mensajePatron: 'Ingrese 8 dígitos, por ejemplo 8888-8888.',
}

// De 9 a 12 digitos con o sin guiones, asi entran la fisica (1-1111-1111), la juridica (3-101-123456) y el DIMEX
export const reglasCedula = {
    patron: /^(?=(?:\D*\d){9,12}\D*$)\d[\d-]*\d$/,
    mensajePatron: 'Ingrese de 9 a 12 dígitos, con o sin guiones.',
}
