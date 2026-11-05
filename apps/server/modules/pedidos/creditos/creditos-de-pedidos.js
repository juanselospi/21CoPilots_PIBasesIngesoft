/**
 * Crédito a favor cuando se le quita algo a un pedido ya pagado: no se
 * devuelve dinero, queda como saldo del cliente para otra compra.
 *
 * Nunca se acredita más de lo que se cobró por el pedido, contando los
 * créditos que ya se dieron por él. Así un producto que el administrador
 * agregó después (y no se cobró) no genera crédito al quitarlo.
 */

export class CreditosDePedidos {
  #pagos;
  #clientes;

  constructor({ pagos, clientes }) {
    this.#pagos = pagos;
    this.#clientes = clientes;
  }

  /**
   * Dentro de la transacción del cambio al pedido.
   * @returns el monto acreditado, 0 si el pedido no estaba pagado
   */
  async otorgar(cliente, { correo, numCarrito, monto, motivo }) {
    const cobrado = await this.#pagos.montoAprobado(correo, numCarrito, cliente);
    if (cobrado <= 0) return 0;

    const yaAcreditado = await this.#clientes.creditoOtorgadoPorPedido(correo, numCarrito, cliente);
    const credito = redondear(Math.min(monto, cobrado - yaAcreditado));
    if (credito <= 0) return 0;

    await this.#clientes.otorgarCreditoEnTransaccion(cliente, { correo, numCarrito, monto: credito, motivo });
    return credito;
  }
}

const redondear = (monto) => Math.round((monto + Number.EPSILON) * 100) / 100;
