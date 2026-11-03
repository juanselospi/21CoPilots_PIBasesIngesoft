import { useState } from 'react'
import { CircleCheck, EyeOff, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
// Mismo aspecto que la página de productos y su vista de tabla
import '../products/Products.css'
import '../../components/product-table/ProductTable.css'
import './Families.css'
import FamilyForm from '../../components/family-form/FamilyForm.jsx'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog.jsx'
import { actualizarFamilia, crearFamilia, eliminarFamilia } from '../../api/catalogo.js'
import { useFamilias } from '../../hooks/useFamilias.js'
import { productCountText, toAdminFamily, toModalFields, toServerFamily } from './toAdminFamily.js'

// Texto del diálogo de confirmación de cada acción
const dialogByAction = {
    desactivar: (family) => ({
        title: 'Desactivar familia',
        message: `Sus ${productCountText(family.productCount)} dejan de verse en la tienda hasta que la reactive. No se borra nada.`,
        confirmLabel: 'Desactivar',
        busyLabel: 'Desactivando…',
    }),
    reactivar: (family) => ({
        title: 'Reactivar familia',
        message: `Sus ${productCountText(family.productCount)} vuelven a verse en la tienda si tienen existencias o admiten contrapedido.`,
        confirmLabel: 'Reactivar',
        busyLabel: 'Reactivando…',
    }),
    eliminar: (family) => ({
        title: 'Eliminar familia',
        message: `Se borra la familia ${family.name}. Solo se puede si no tiene productos; si tiene, desactívela.`,
        confirmLabel: 'Eliminar',
        busyLabel: 'Eliminando…',
    }),
}

// Mensaje que queda arriba de la tabla después de cada acción
const noticeByAction = {
    desactivar: (name) => `Se desactivó la familia ${name}.`,
    reactivar: (name) => `Se reactivó la familia ${name}.`,
    eliminar: (name) => `Se eliminó la familia ${name}.`,
}

const formatPercent = (value) => `${value} %`

// Pantalla «Familias» del panel (HU-16): consultar, agregar, editar, desactivar y eliminar familias.
function Families() {
    const familias = useFamilias()
    const families = familias.datos?.map(toAdminFamily) ?? []
    // Modal abierto: { family: null } para agregar o { family } para editar
    const [form, setForm] = useState(null)
    // Acción esperando confirmación: { action, family }
    const [pending, setPending] = useState(null)
    const [notice, setNotice] = useState(null)

    // Guarda la familia, cierra el modal y recarga la tabla.
    // Le devuelve al modal el error si el servidor la rechazó.
    const handleSave = async (values) => {
        try {
            const guardada = form.family
                ? await actualizarFamilia(form.family.name, toServerFamily(values))
                : await crearFamilia(toServerFamily(values))
            setForm(null)
            setNotice(`Se guardó la familia ${guardada.nombre}.`)
            familias.recargar()
            return {}
        } catch (error) {
            // Nombre repetido: el servidor no indica el campo, pero siempre es el nombre
            const repeated = error.detalles?.regla === 'FAMILIA_REPETIDA' || error.codigo === 'REGISTRO_DUPLICADO'
            return { error: error.message, fields: repeated ? ['name'] : toModalFields(error.detalles?.campos ?? []) }
        }
    }

    // Si falla, el diálogo muestra el mensaje del servidor (por ejemplo, la familia tiene productos)
    const runAction = async () => {
        const { action, family } = pending
        if (action === 'eliminar') await eliminarFamilia(family.name)
        else await actualizarFamilia(family.name, { activa: action === 'reactivar' })
        setPending(null)
        setNotice(noticeByAction[action](family.name))
        familias.recargar()
    }

    const openForm = (family) => {
        setNotice(null)
        setForm({ family })
    }

    const askAction = (action, family) => {
        setNotice(null)
        setPending({ action, family })
    }

    return (
        <main className='products'>
            <section className='products-header'>
                <h1>Familias</h1>
                <div className='products-actions'>
                    <button type='button' className='products-button products-button-primary' onClick={() => openForm(null)}>
                        <Plus size={20} />Agregar familia
                    </button>
                </div>
            </section>

            <p className='families-intro'>
                Cada familia define la importación y el margen de sus productos. Un producto con valor propio no cambia
                cuando cambia su familia.
            </p>

            {notice && <p className='families-notice' role='status'>{notice}</p>}

            {familias.cargando ? (
                <p className='products-status' role='status'>Cargando familias…</p>
            ) : familias.error ? (
                <div className='products-status products-status-error' role='alert'>
                    <p>{familias.error}</p>
                    <button type='button' className='products-status-button' onClick={familias.recargar}>
                        Reintentar
                    </button>
                </div>
            ) : families.length === 0 ? (
                <section className='products-empty'>
                    <h2>Todavía no hay familias</h2>
                    <p>Agréguelas aquí o se crean solas al cargar el Excel del catálogo.</p>
                </section>
            ) : (
                <div className='product-table-wrapper'>
                    <table className='product-table'>
                        <thead>
                            <tr>
                                <th scope='col'>Nombre</th>
                                <th scope='col'>Descripción</th>
                                <th scope='col' className='product-table-number'>Importación</th>
                                <th scope='col' className='product-table-number'>Margen</th>
                                <th scope='col' className='product-table-number'>Productos</th>
                                <th scope='col'>Estado</th>
                                <th scope='col'><span className='product-table-hidden'>Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {families.map((family) => (
                                <tr key={family.name}>
                                    <td className='families-name'>{family.name}</td>
                                    <td className='families-description'>{family.description || '—'}</td>
                                    <td className='product-table-number'>{formatPercent(family.importacionPct)}</td>
                                    <td className='product-table-number'>{formatPercent(family.margenPct)}</td>
                                    <td className='product-table-number'>{family.productCount}</td>
                                    <td>
                                        {family.active ? (
                                            <span className='chip chip-ok'><CircleCheck size={16} />Activa</span>
                                        ) : (
                                            <span className='chip'><EyeOff size={16} />Inactiva</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className='product-table-actions'>
                                            <button
                                                type='button'
                                                className='product-table-button'
                                                aria-label={`Editar ${family.name}`}
                                                onClick={() => openForm(family)}
                                            >
                                                <Pencil size={16} />Editar
                                            </button>
                                            {family.active ? (
                                                <button
                                                    type='button'
                                                    className='product-table-button'
                                                    aria-label={`Desactivar ${family.name}`}
                                                    onClick={() => askAction('desactivar', family)}
                                                >
                                                    <PowerOff size={16} />Desactivar
                                                </button>
                                            ) : (
                                                <button
                                                    type='button'
                                                    className='product-table-button'
                                                    aria-label={`Reactivar ${family.name}`}
                                                    onClick={() => askAction('reactivar', family)}
                                                >
                                                    <Power size={16} />Reactivar
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                className='product-table-button product-table-button-danger'
                                                aria-label={`Eliminar ${family.name}`}
                                                onClick={() => askAction('eliminar', family)}
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
            )}

            {form && <FamilyForm family={form.family} onClose={() => setForm(null)} onSave={handleSave} />}

            {pending && (
                <ConfirmDialog
                    {...dialogByAction[pending.action](pending.family)}
                    onConfirm={runAction}
                    onCancel={() => setPending(null)}
                />
            )}
        </main>
    )
}

export default Families
