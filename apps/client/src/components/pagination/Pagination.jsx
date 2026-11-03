import { ChevronLeft, ChevronRight } from 'lucide-react'
import { paginasVisibles } from '../../utils/paginas.js'

// Paginación numerada con la página actual resaltada; usa los estilos de .products-pagination
// (Products.css). `page` empieza en 0 y `summary` es el texto de la derecha, por ejemplo el total.
function Pagination({ page, pageCount, onChange, label, summary, className = '' }) {
    return (
        <nav className={`products-pagination ${className}`} aria-label={label}>
            {pageCount > 1 && (
                <>
                    <button type='button' disabled={page === 0} onClick={() => onChange(page - 1)}>
                        <ChevronLeft size={16} />Anterior
                    </button>
                    {paginasVisibles(page, pageCount).map((number) => (
                        <button
                            key={number}
                            type='button'
                            className={number === page ? 'active' : ''}
                            aria-current={number === page ? 'page' : undefined}
                            onClick={() => onChange(number)}
                        >
                            {number + 1}
                        </button>
                    ))}
                    <button type='button' disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)}>
                        Siguiente<ChevronRight size={16} />
                    </button>
                </>
            )}
            {summary && <span className='pagination-summary'>{summary}</span>}
        </nav>
    )
}

export default Pagination
