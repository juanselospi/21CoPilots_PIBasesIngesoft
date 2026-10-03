// Filtros sin aplicar; las claves son los parámetros que acepta el servidor (RF-43)
export const emptyFilters = {
    categoria: '',
    disponibilidad: '',
    existenciasBajas: false,
    margenNegativo: false,
    precioMin: '',
    precioMax: '',
}

// Estados de disponibilidad de un producto (RF-07)
export const availabilityOptions = [
    { value: 'en_existencia', label: 'En existencia' },
    { value: 'por_contrapedido', label: 'Por contrapedido' },
    { value: 'no_disponible', label: 'No disponible (oculto en la tienda)' },
]

// Etiquetas de los filtros aplicados, para mostrarlos y poder quitarlos uno por uno
export const activeFilterTags = (filters, formatPrice) => {
    const tags = []
    if (filters.categoria) {
        tags.push({ key: 'categoria', label: filters.categoria })
    }
    if (filters.disponibilidad) {
        const option = availabilityOptions.find(({ value }) => value === filters.disponibilidad)
        tags.push({ key: 'disponibilidad', label: option?.label ?? filters.disponibilidad })
    }
    if (filters.existenciasBajas) {
        tags.push({ key: 'existenciasBajas', label: 'Existencias bajas' })
    }
    if (filters.margenNegativo) {
        tags.push({ key: 'margenNegativo', label: 'Margen negativo' })
    }
    if (filters.precioMin !== '') {
        tags.push({ key: 'precioMin', label: `Desde ${formatPrice(Number(filters.precioMin))}` })
    }
    if (filters.precioMax !== '') {
        tags.push({ key: 'precioMax', label: `Hasta ${formatPrice(Number(filters.precioMax))}` })
    }
    return tags
}
