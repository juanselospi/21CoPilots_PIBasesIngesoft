import { Archive, Clock, EyeOff, Tag, TrendingDown, TriangleAlert } from 'lucide-react'

// Color e icono de cada etiqueta que calcula el servidor; una etiqueta nueva sale en gris.
// Los usan la tabla de productos y las alertas de inventario.
export const chipByLabel = {
    contrapedido: { className: 'chip chip-info', Icon: Clock },
    margen_negativo: { className: 'chip chip-error', Icon: TrendingDown },
    existencias_bajas: { className: 'chip chip-aviso', Icon: TriangleAlert },
    oculto_en_tienda: { className: 'chip', Icon: EyeOff },
    descontinuado: { className: 'chip', Icon: Archive },
}

export const defaultChip = { className: 'chip', Icon: Tag }
