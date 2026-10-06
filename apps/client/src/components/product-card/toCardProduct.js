// El público solo recibe estos dos estados: los no disponibles el servidor no los muestra.
// Verificar con equipo para contrapedido.
const availabilityByDisponibilidad = {
    en_existencia: 'in-stock',
    por_contrapedido: 'backorder',
}

// Pasa el producto del catálogo a las props de ProductCard.
export const toCardProduct = ({ sku, nombre, descripcion, categoria, precioFinal, imagenUrl, disponibilidad }) => ({
    sku,
    name: nombre,
    description: descripcion,
    category: categoria,
    price: precioFinal,
    image: imagenUrl,
    availability: availabilityByDisponibilidad[disponibilidad],
})
