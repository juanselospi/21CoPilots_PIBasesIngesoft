// Deja cada movimiento del saldo a favor listo para mostrarlo en Mi cuenta
export function movimientoDeCredito({ tipo, motivo, numCarrito }) {
    const usado = tipo === 'usado'
    return {
        etiqueta: usado ? 'Usado' : 'A favor',
        signo: usado ? '−' : '+',
        // Un pago con credito no trae motivo, por eso se dice que fue
        motivo: motivo ?? (usado ? 'Pago con tu saldo a favor' : 'Crédito a favor'),
        numCarrito: numCarrito ?? null,
    }
}
