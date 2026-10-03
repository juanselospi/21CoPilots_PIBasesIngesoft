// El público solo recibe estos dos estados: los no disponibles el
// servidor no los debe mandar (RF-07, RF-08, RN-03).
const availabilityByDisponibilidad = {
    en_existencia: 'in-stock',
    por_contrapedido: 'backorder',
}

// Pasa el producto del catálogo a las props de ProductCard.
export const toCardProduct = ({ sku, nombre, categoria, precioFinal, imagenUrl, disponibilidad }) => ({
    sku,
    name: nombre,
    category: categoria,
    price: precioFinal,
    image: imagenUrl,
    availability: availabilityByDisponibilidad[disponibilidad],
})
