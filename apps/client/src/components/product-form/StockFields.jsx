import { readStockInput } from './stockInput.js'

// Existencias y contrapedido; los usan los modales de agregar y editar producto.
// `onChange` recibe el campo ('stock' o 'backorder') y su valor nuevo.
function StockFields({ stock, backorder, error, disabled, optional = false, onChange }) {
    const handleStockChange = (input) => {
        const value = readStockInput(input)
        if (value !== null) onChange('stock', value)
    }

    // RN-03: sin existencias, la tienda solo lo muestra si admite contrapedido
    const hidden = Number(stock || 0) === 0 && !backorder

    return (
        <section className='product-form-stock'>
            <label className='product-form-field'>
                <span>Existencias{optional && <small className='product-form-optional'> (opcional)</small>}</span>
                <div className='product-form-input'>
                    <input
                        type='text'
                        inputMode='numeric'
                        required={!optional}
                        disabled={disabled}
                        placeholder={optional ? '0' : undefined}
                        aria-invalid={Boolean(error)}
                        value={stock}
                        onChange={(event) => handleStockChange(event.target.value)}
                    />
                    <span>unidades</span>
                </div>
                {error && <p className='product-form-error'>{error}</p>}
            </label>

            <label className='product-form-check'>
                <input
                    type='checkbox'
                    disabled={disabled}
                    checked={backorder}
                    onChange={(event) => onChange('backorder', event.target.checked)}
                />
                <span>Admite contrapedido (se puede vender sin existencias)</span>
            </label>

            {hidden && <p className='product-form-hint'>Sin existencias ni contrapedido, no se muestra en la tienda.</p>}
        </section>
    )
}

export default StockFields
