/**
 * ADAPTADOR — pasarela simulada.
 *
 * Implementa la interfaz completa con datos ficticios: el flujo de compra
 * se construye y se prueba entero, y la integración productiva queda como
 * trabajo posterior sin tocar la lógica de pedidos (§ 5.1).
 */

import { randomUUID } from "node:crypto";
import { PasarelaDePago } from "../pasarela-de-pago.port.js";

export class PasarelaSimulada extends PasarelaDePago {
  #cobros = new Map();

  async cobrar({ monto, metodo }) {
    // El pago contra entrega no cobra en línea: queda pendiente hasta que
    // el mensajero entrega (RN-11, RF-69).
    if (metodo === "contra_entrega") {
      return { resultado: "pendiente", referencia: null, motivo: "PAGO_CONTRA_ENTREGA" };
    }

    // La referencia debe ser única: `referencia_externa` es UNIQUE.
    const referencia = `SIM-${randomUUID()}`;
    const resultado = monto > 0
      ? { resultado: "aprobado", referencia, motivo: null }
      : { resultado: "rechazado", referencia, motivo: "MONTO_INVALIDO" };

    this.#cobros.set(referencia, resultado);
    return resultado;
  }

  async consultarEstado(referencia) {
    return (
      this.#cobros.get(referencia) ?? {
        resultado: "rechazado",
        referencia,
        motivo: "REFERENCIA_DESCONOCIDA",
      }
    );
  }
}
