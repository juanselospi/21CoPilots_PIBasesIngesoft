/**
 * ADAPTADOR: pasarela simulada.
 *
 * Implementa la interfaz completa con datos ficticios: el flujo de compra
 * se construye y se prueba entero, y la integración productiva queda como
 * trabajo posterior sin tocar la lógica de pedidos.
 */

import { randomUUID } from "node:crypto";
import { PasarelaDePago } from "../pasarela-de-pago.port.js";

export class PasarelaSimulada extends PasarelaDePago {
  #cobros = new Map();

  async cobrar({ monto, metodo, datosTarjeta = null }) {
    // El pago contra entrega no cobra en línea: queda pendiente hasta que
    // el mensajero entrega (RN-11, RF-69).
    if (metodo === "contra_entrega") {
      return { resultado: "pendiente", referencia: null, motivo: "PAGO_CONTRA_ENTREGA" };
    }

    // La referencia es la llave de pagos.pago, así que no se puede repetir.
    const referencia = `SIM-${randomUUID()}`;
    const resultado =
      monto <= 0
        ? { resultado: "rechazado", referencia, motivo: "MONTO_INVALIDO" }
        : esTarjetaDeRechazo(metodo, datosTarjeta)
          ? { resultado: "rechazado", referencia, motivo: "TARJETA_RECHAZADA" }
          : { resultado: "aprobado", referencia, motivo: null };

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

// Para la demo: una tarjeta que termina en 0000 siempre se rechaza
const esTarjetaDeRechazo = (metodo, datosTarjeta) =>
  metodo === "tarjeta" && String(datosTarjeta?.numero ?? "").endsWith("0000");
