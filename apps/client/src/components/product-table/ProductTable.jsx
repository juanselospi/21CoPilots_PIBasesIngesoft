import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import './ProductTable.css'
import { chipByLabel, defaultChip } from './labelChips.js'

// Vista de tabla del listado de productos del panel.
// Solo muestra lo que recibe; "Editar" avisa con `onEdit` y
// desactivar, reactivar o eliminar con `onAction(acción, producto)`.
function ProductTable({ products, formatPrice, onEdit, onAction }) {
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
                                <div className='product-table-actions'>
                                    <button
                                        type='button'
                                        className='product-table-button'
                                        aria-label={`Editar ${product.name}`}
                                        onClick={() => onEdit(product)}
                                    >
                                        <Pencil size={16} />Editar
                                    </button>
                                    {product.discontinued ? (
                                        <button
                                            type='button'
                                            className='product-table-button'
                                            aria-label={`Reactivar ${product.name}`}
                                            onClick={() => onAction('reactivar', product)}
                                        >
                                            <ArchiveRestore size={16} />Reactivar
                                        </button>
                                    ) : (
                                        <button
                                            type='button'
                                            className='product-table-button'
                                            aria-label={`Desactivar ${product.name}`}
                                            onClick={() => onAction('desactivar', product)}
                                        >
                                            <Archive size={16} />Desactivar
                                        </button>
                                    )}
                                    <button
                                        type='button'
                                        className='product-table-button product-table-button-danger'
                                        aria-label={`Eliminar ${product.name}`}
                                        onClick={() => onAction('eliminar', product)}
                                    >
                                        <Trash2 size={16} />Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ProductTable
