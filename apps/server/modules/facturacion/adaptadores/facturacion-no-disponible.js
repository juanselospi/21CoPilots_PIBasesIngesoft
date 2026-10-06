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
