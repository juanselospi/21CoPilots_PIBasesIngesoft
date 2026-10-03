import './ProductTable.css'

// Vista de tabla del listado de productos del panel (RF-43).
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
                            <td className='product-table-sku'>{product.sku}</td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td className='product-table-number'>{formatPrice(product.price)}</td>
                            <td className='product-table-number'>{product.stock}</td>
                            <td>
                                <div className='product-table-labels'>
                                    {product.labels.map(({ key, text }) => (
                                        <span key={key} className={`product-table-label product-table-label-${key}`}>
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td>
                                <button
                                    type='button'
                                    className='product-table-button'
                                    aria-label={`Editar precio de ${product.name}`}
                                    onClick={() => onEdit(product)}
                                >
                                    Editar
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
