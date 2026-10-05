import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, X } from 'lucide-react'
import './ImportExcel.css'
import { TEMPLATE_URL, importProducts } from '../../api/importaciones.js'

// se evita subir un archivo que se va a rechazar
const MAX_SIZE_MB = 5

// Botón "Cargar Excel" del encabezado de Productos. Maneja su propio estado
// para que la página solo tenga que ponerlo. `onImported` avisa que entraron
// productos, para que la página recargue su listado.
function ImportExcel({ onImported }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button type='button' className='products-button' onClick={() => setOpen(true)}>
                <FileSpreadsheet size={20} />Cargar Excel
            </button>
            {open && <ImportExcelModal onClose={() => setOpen(false)} onImported={onImported} />}
        </>
    )
}

function ImportExcelModal({ onClose, onImported }) {
    const [file, setFile] = useState(null)
    const [error, setError] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)

    // Mientras sube no se puede cerrar
    const close = () => {
        if (!uploading) onClose()
    }

    useEffect(() => {
        const closeOnEscape = (event) => event.key === 'Escape' && !uploading && onClose()
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [uploading, onClose])

    // se convierte en un enlace de descarga
    const reportUrl = useMemo(() => {
        if (!result?.reporte) return null
        const { contenidoBase64, tipo } = result.reporte
        const bytes = Uint8Array.from(atob(contenidoBase64), (letra) => letra.charCodeAt(0))
        return URL.createObjectURL(new Blob([bytes], { type: tipo }))
    }, [result])

    useEffect(() => () => reportUrl && URL.revokeObjectURL(reportUrl), [reportUrl])

    // manejo del archivo seleccionado
    const handleFileChange = (event) => {
        const selected = event.target.files[0] ?? null
        setError(null)

        if (selected && !/\.xlsx$/i.test(selected.name)) {
            setFile(null)
            setError('Elija un archivo de Excel (.xlsx).')
        } else if (selected && selected.size > MAX_SIZE_MB * 1024 * 1024) {
            setFile(null)
            setError(`El archivo pesa más de ${MAX_SIZE_MB} MB.`)
        } else {
            setFile(selected)
        }
    }

    // envio del archivo
    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!file) return

        setUploading(true)
        setError(null)
        try {
            setResult(await importProducts(file))
            onImported?.()
        } catch (importError) {
            setError(importError.message)
        } finally {
            setUploading(false)
        }
    }

    // reinicio del proceso
    const startOver = () => {
        setFile(null)
        setResult(null)
        setError(null)
    }

    return (
        <div className='import-excel-overlay' onClick={close}>
            <div
                className='import-excel-modal'
                role='dialog'
                aria-modal='true'
                aria-labelledby='import-excel-title'
                onClick={(event) => event.stopPropagation()}
            >
                <header className='import-excel-header'>
                    <div>
                        <h2 id='import-excel-title'>Cargar productos desde Excel</h2>
                        <p>Los productos que ya existen se actualizan por su código.</p>
                    </div>
                    <button
                        type='button'
                        className='import-excel-close'
                        aria-label='Cerrar'
                        onClick={close}
                        disabled={uploading}
                    >
                        <X size={20} />
                    </button>
                </header>

                {result ? (
                    <ImportSummary result={result} reportUrl={reportUrl} />
                ) : (
                    <form className='import-excel-form' onSubmit={handleSubmit}>
                        <p className='import-excel-hint'>
                            Use la plantilla oficial o su hoja de siempre, con las mismas columnas.{' '}
                            <a href={TEMPLATE_URL} download>Descargar plantilla</a>
                        </p>

                        <label className='import-excel-file'>
                            <span>Archivo (.xlsx, máximo {MAX_SIZE_MB} MB)</span>
                            <input
                                type='file'
                                accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </label>

                        {error && <p className='import-excel-error' role='alert'>{error}</p>}

                        <div className='import-excel-actions'>
                            <button type='button' className='products-button' onClick={close} disabled={uploading}>
                                Cancelar
                            </button>
                            <button
                                type='submit'
                                className='products-button products-button-primary'
                                disabled={!file || uploading}
                            >
                                {uploading ? 'Importando…' : 'Importar'}
                            </button>
                        </div>
                    </form>
                )}

                {result && (
                    <div className='import-excel-actions'>
                        <button type='button' className='products-button' onClick={startOver}>
                            Importar otro archivo
                        </button>
                        <button type='button' className='products-button products-button-primary' onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function ImportSummary({ result, reportUrl }) {
    const { leidas, importadas, actualizadas, rechazadas, reporte } = result

    return (
        <section className='import-excel-summary' aria-live='polite'>
            <p>Se leyeron {leidas} {leidas === 1 ? 'fila' : 'filas'} del archivo.</p>

            <dl className='import-excel-counts'>
                <div>
                    <dt>Nuevos</dt>
                    <dd>{importadas}</dd>
                </div>
                <div>
                    <dt>Actualizados</dt>
                    <dd>{actualizadas}</dd>
                </div>
                <div className={rechazadas.length > 0 ? 'import-excel-count-rejected' : ''}>
                    <dt>Rechazadas</dt>
                    <dd>{rechazadas.length}</dd>
                </div>
            </dl>

            {rechazadas.length === 0 ? (
                <p className='import-excel-ok'>Todas las filas se importaron correctamente.</p>
            ) : (
                <>
                    <p>
                        Estas filas no se importaron. Corríjalas en su hoja y vuelva a cargarla; las
                        demás ya quedaron guardadas.
                    </p>
                    {reportUrl && (
                        <a className='import-excel-report' href={reportUrl} download={reporte.nombreArchivo}>
                            Descargar reporte de filas rechazadas
                        </a>
                    )}
                    <div className='import-excel-table-wrapper'>
                        <table className='import-excel-table'>
                            <thead>
                                <tr>
                                    <th>Fila</th>
                                    <th>Código</th>
                                    <th>Motivos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rechazadas.map(({ fila, codigoSku, motivos }) => (
                                    <tr key={fila}>
                                        <td>{fila}</td>
                                        <td className='codigo'>{codigoSku ?? '(vacío)'}</td>
                                        <td>
                                            {motivos.map((motivo) => (
                                                <span key={motivo}>{motivo}</span>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}

export default ImportExcel
