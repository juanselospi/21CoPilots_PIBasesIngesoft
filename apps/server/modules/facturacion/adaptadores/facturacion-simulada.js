/**
 * ADAPTADOR — facturación simulada (RES-03, RF-41).
 *
 * PENDIENTE: la factura ya no tiene pedido_id, el consecutivo simulado se deberia sacar del
 * num_referencia del pago, que tambien es unico.
 *
 * No devuelve un valor fijo (§ 5.1): valida que vengan los datos fiscales
 * del emisor y del receptor antes de "emitir", que es justo lo que
 * verifica RNF-18. Así la prueba del requerimiento corre hoy, contra el
 * placeholder, y seguirá corriendo contra Hacienda.
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
