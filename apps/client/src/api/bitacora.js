// Llamadas al servidor para consultar la bitácora de auditoría.

import { pedir } from './clienteHttp.js'

// De lo más nuevo a lo más viejo; responde { datos, meta } con el total para paginar
export function listarBitacora({ evento, desde, hasta, limite, pagina } = {}, { signal } = {}) {
    return pedir('/api/admin/bitacora', { parametros: { evento, desde, hasta, limite, pagina }, signal, conMeta: true })
}
