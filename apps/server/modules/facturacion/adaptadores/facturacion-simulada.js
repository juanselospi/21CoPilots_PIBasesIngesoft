/**
 * Facturación simulada.
 */

import { FacturacionElectronica } from "../facturacion-electronica.port.js";

export class FacturacionSimulada extends FacturacionElectronica {
  async emitir({ numReferencia, emisor, receptor, lineas }) {
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

    // Un pago tiene a lo sumo una factura, así que el consecutivo simulado
    // se deriva de su referencia y no se repite al reiniciar.
    return {
      estado: "emitida",
      consecutivo: `FAC-${numReferencia}`,
      motivo: null,
    };
  }
}
