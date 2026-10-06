import { Clock, EyeOff, Pencil, Tag, TrendingDown, TriangleAlert } from 'lucide-react'
import './ProductTable.css'

// Color e icono de cada etiqueta que calcula el servidor; una etiqueta nueva sale en gris.
const chipByLabel = {
    contrapedido: { className: 'chip chip-info', Icon: Clock },
    margen_negativo: { className: 'chip chip-error', Icon: TrendingDown },
    existencias_bajas: { className: 'chip chip-aviso', Icon: TriangleAlert },
    oculto_en_tienda: { className: 'chip', Icon: EyeOff },
}

const defaultChip = { className: 'chip', Icon: Tag }

// Vista de tabla del listado de productos del panel.
// Solo muestra lo que recibe; "Editar" avisa con `onEdit`.
function ProductTable({ products, formatPrice, onEdit }) {
    return (
        <div className='product-table-wrapper'>
            <table className='product-table'>
                <thead>
                    <tr>
                        <th scope='col'>Código</th>
                        <th scope='col'>Nombre</th>
                        <th scope='col'>Categoría</th>
                        <th scope='col' className='product-table-number'>Precio</th>
                        <th scope='col' className='product-table-number'>Existencias</th>
                        <th scope='col'>Etiquetas</th>
                        <th scope='col'><span className='product-table-hidden'>Acciones</span></th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.sku}>
                            <td className='product-table-sku codigo'>{product.sku}</td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td className='product-table-number'>{formatPrice(product.price)}</td>
                            <td className='product-table-number'>{product.stock}</td>
                            <td>
                                <div className='product-table-labels'>
                                    {product.labels.map(({ key, text }) => {
                                        const { className, Icon } = chipByLabel[key] ?? defaultChip
                                        return (
                                            <span key={key} className={className}>
                                                <Icon size={16} />
                                                {text}
                                            </span>
                                        )
                                    })}
                                </div>
                            </td>
                            <td>
                                <button
                                    type='button'
                                    className='product-table-button'
                                    aria-label={`Editar ${product.name}`}
                                    onClick={() => onEdit(product)}
                                >
                                    <Pencil size={16} />Editar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ProductTable
