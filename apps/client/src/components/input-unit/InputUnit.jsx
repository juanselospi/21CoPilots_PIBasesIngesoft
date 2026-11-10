// Unidad integrada a la caja de un input (.product-form-input), con su fondo y una
// línea que la separa del valor. Los estilos están en product-form/ProductForm.css.
// Va siempre después del <input>; el $ se muestra delante con CSS.
//
// El lector de pantalla no lee los símbolos: el $ se oye como «en dólares» y el %
// no se lee porque la etiqueta ya lo dice («Margen (%)»). Las palabras se leen tal cual.
const unitConfig = {
    $: { prefix: true, spoken: 'en dólares' },
    '%': { spoken: '' },
}

function InputUnit({ unit }) {
    const config = unitConfig[unit]
    const className = `product-form-unit${config?.prefix ? ' product-form-unit-prefix' : ''}`

    if (!config) return <span className={className}>{unit}</span>

    return (
        <span className={className}>
            <span aria-hidden='true'>{unit}</span>
            {config.spoken && <span className='solo-lector'> {config.spoken}</span>}
        </span>
    )
}

export default InputUnit
