// Traduce las familias entre el formato del servidor y el de la pantalla Familias y su modal.

// Nombre del campo en el modal → nombre en el servidor
const serverFieldByModalField = {
    name: 'nombre',
    description: 'descripcion',
    importacionPct: 'porcentajeImportacion',
    margenPct: 'margenGanancia',
}

// Familia del servidor → datos para la tabla y el modal
export const toAdminFamily = ({ nombre, descripcion, porcentajeImportacion, margenGanancia, activa, totalDeProductos }) => ({
    name: nombre,
    description: descripcion,
    importacionPct: porcentajeImportacion,
    margenPct: margenGanancia,
    active: activa,
    productCount: totalDeProductos,
})

// Valores del modal → cuerpo que espera el servidor
export const toServerFamily = (values) =>
    Object.fromEntries(Object.entries(values).map(([field, value]) => [serverFieldByModalField[field], value]))

// Campos con error que reporta el servidor → campos del modal
export const toModalFields = (serverFields = []) =>
    Object.keys(serverFieldByModalField).filter((field) => serverFields.includes(serverFieldByModalField[field]))

// Campos del modal que marcar cuando el servidor rechaza una familia.
// Nombre repetido: el servidor no indica el campo, pero siempre es el nombre.
export const familyErrorFields = (error) =>
    error.detalles?.regla === 'FAMILIA_REPETIDA' || error.codigo === 'REGISTRO_DUPLICADO'
        ? ['name']
        : toModalFields(error.detalles?.campos ?? [])

export const productCountText =(count) => (count === 1 ? '1 producto' : `${count} productos`)
