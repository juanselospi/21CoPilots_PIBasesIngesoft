import { ChevronLeft, ChevronRight } from 'lucide-react'
import { elementosDePaginacion } from '../../utils/paginas.js'

// Paginación numerada con la página actual resaltada; usa los estilos de .products-pagination
// (Products.css). `page` empieza en 0 y `summary` es el texto que la acompaña, por ejemplo el total.
// Con muchas páginas muestra los extremos y puntos suspensivos; en pantallas angostas
// «Anterior» y «Siguiente» quedan solo como flecha. Con una sola página no muestra los botones, salvo con `alwaysShow`.
function Pagination({ page, pageCount, onChange, label, summary, className = '', alwaysShow = false }) {
    return (
        <nav className={`products-pagination ${className}`} aria-label={label}>
            {(pageCount > 1 || alwaysShow) && (
                <div className='pagination-pages'>
                    <button type='button' aria-label='Página anterior' disabled={page === 0} onClick={() => onChange(page - 1)}>
                        <ChevronLeft size={16} aria-hidden='true' />
                        <span className='pagination-word'>Anterior</span>
                    </button>
                    {elementosDePaginacion(page, pageCount).map((number, index) =>
                        number === '…' ? (
                            <span key={`hueco-${index}`} className='pagination-gap' aria-hidden='true'>…</span>
                        ) : (
                            <button
                                key={number}
                                type='button'
                                className={number === page ? 'active' : ''}
                                aria-label={`Página ${number + 1}`}
                                aria-current={number === page ? 'page' : undefined}
                                onClick={() => onChange(number)}
                            >
                                {number + 1}
                            </button>
                        ),
                    )}
                    <button
                        type='button'
                        aria-label='Página siguiente'
                        disabled={page >= pageCount - 1}
                        onClick={() => onChange(page + 1)}
                    >
                        <span className='pagination-word'>Siguiente</span>
                        <ChevronRight size={16} aria-hidden='true' />
                    </button>
                </div>
            )}
            {summary && <span className='pagination-summary'>{summary}</span>}
        </nav>
    )
}

export default Pagination
