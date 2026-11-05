import { useEffect } from 'react'
import { Link } from 'react-router'
import { PackagePlus, TriangleAlert, X } from 'lucide-react'
// Mismo aspecto que los modales de producto y la tabla del panel
import '../product-form/ProductForm.css'
import '../product-table/ProductTable.css'
import './InventoryAlerts.css'
import { chipByLabel } from '../product-table/labelChips.js'

// La misma etiqueta «Existencias bajas» del listado de productos
const lowStockChip = chipByLabel.existencias_bajas
const backorderChip = chipByLabel.contrapedido

// Pantalla de ingreso de mercancía con el producto ya elegido (SCRUM-113)
const restockPath = (sku) => `/admin/mercancia?sku=${encodeURIComponent(sku)}`

// Modal «Alertas de inventario» (HU-08, RF-16): productos con existencias en el umbral o por debajo.
// Solo muestra lo que recibe; `alerts` es el resultado de useAlertasDeInventario.
function InventoryAlerts({ alerts, onClose }) {
    const products = alerts.datos?.datos ?? []
    const threshold = alerts.datos?.meta.umbral

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [onClose])

    return (
        <div className='product-form-overlay' onClick={onClose}>
            <div
                className='product-form-modal inventory-alerts'
                role='dialog'
                aria-modal='true'
                aria-labelledby='inventory-alerts-title'
                onClick={(event) => event.stopPropagation()}
            >
                <header className='product-form-header'>
                    <div>
                        <h2 id='inventory-alerts-title' className='inventory-alerts-title'>
                            <TriangleAlert size={22} />Alertas de inventario
                        </h2>
                        {threshold !== undefined && (
                            <p>
                                {products.length === 1 ? '1 producto' : `${products.length} productos`} con{' '}
                                {threshold === 1 ? '1 unidad' : `${threshold} unidades`} o menos
                            </p>
                        )}
                    </div>
                    <button type='button' className='product-form-close' aria-label='Cerrar' onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                {alerts.cargando ? (
                    <p className='product-form-message' role='status'>Cargando alertas…</p>
                ) : alerts.error ? (
                    <div className='inventory-alerts-error'>
                        <p className='product-form-alert' role='alert'>{alerts.error}</p>
                        <button type='button' className='product-form-button' onClick={alerts.recargar}>Reintentar</button>
                    </div>
                ) : products.length === 0 ? (
                    <p className='product-form-success' role='status'>No hay productos con existencias bajas.</p>
                ) : (
                    <div className='product-table-wrapper inventory-alerts-list'>
                        <table className='product-table'>
                            <thead>
                                <tr>
                                    <th scope='col'>Código</th>
                                    <th scope='col'>Producto</th>
                                    <th scope='col' className='product-table-number'>Existencias</th>
                                    <th scope='col'>Etiquetas</th>
                                    <th scope='col'><span className='product-table-hidden'>Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(({ sku, nombre, familia, existencias, admiteContrapedido }) => (
                                    <tr key={sku}>
                                        <td className='product-table-sku codigo'>{sku}</td>
                                        <td className='inventory-alerts-name'>
                                            {nombre}
                                            <span className='inventory-alerts-family'>{familia}</span>
                                        </td>
                                        <td className='product-table-number'>{existencias}</td>
                                        <td>
                                            <div className='product-table-labels'>
                                                <span className={lowStockChip.className}>
                                                    <lowStockChip.Icon size={16} />Existencias bajas
                                                </span>
                                                {admiteContrapedido && (
                                                    <span className={backorderChip.className}>
                                                        <backorderChip.Icon size={16} />Admite contrapedido
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Link
                                                to={restockPath(sku)}
                                                className='product-table-button inventory-alerts-link'
                                                aria-label={`Registrar mercancía de ${nombre}`}
                                                onClick={onClose}
                                            >
                                                <PackagePlus size={16} />Registrar mercancía
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InventoryAlerts
