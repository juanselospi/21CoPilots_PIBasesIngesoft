/**
 * Facturación simulada.
 */

import { FacturacionElectronica } from "../facturacion-electronica.port.js";

export class FacturacionSimulada extends FacturacionElectronica {
  async emitir({ pedidoId, emisor, receptor, lineas }) {
    const faltantes = [];
    if (!emisor?.razonSocial) faltantes.push("razón social del emisor");
    if (!emisor?.cedulaJuridica) faltantes.push("cédula jurídica del emisor");
    if (!receptor?.nombre) faltantes.push("nombre del receptor");
    if (!receptor?.cedula) faltantes.push("cédula del receptor");
    if (!lineas?.length) faltantes.push("líneas de la factura");

    if (faltantes.length > 0) {
      return {
        estado: "rechazada",
        consecutivo: null,
        motivo: `DATOS_FISCALES_INCOMPLETOS: ${faltantes.join(", ")}`,
      };
    }

    // Un pedido tiene a lo sumo una factura (pedido_id UNIQUE), así que el
    // consecutivo simulado se deriva del pedido y no se repite al reiniciar.
    return {
      estado: "emitida",
      consecutivo: `SIM-${String(pedidoId).padStart(10, "0")}`,
      motivo: null,
    };
  }
}
