/**
 * ADAPTADOR NULO (Null Object) — Hacienda no responde.
 *
 * PENDIENTE: facturacion.factura no tiene columna estado, entonces una factura pendiente no se
 * guarda y hay que decidir como se reintenta (ver cambios-siguiente-sprint.md).
 *
 * Igual que la pasarela nula: el pedido se registra y el inventario se
 * mueve; la factura queda en estado "pendiente" de emisión (RNF-06).
 */

import { FacturacionElectronica } from "../facturacion-electronica.port.js";

export class FacturacionNoDisponible extends FacturacionElectronica {
  async emitir() {
    return {
      estado: "pendiente",
      consecutivo: null,
      motivo: "FACTURACION_NO_DISPONIBLE",
    };
  }
}
