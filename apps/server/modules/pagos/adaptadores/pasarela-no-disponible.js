/**
 * ADAPTADOR NULO.
 */

import { PasarelaDePago } from "../pasarela-de-pago.port.js";

const RESPUESTA = Object.freeze({
  resultado: "no_disponible",
  referencia: null,
  motivo: "PASARELA_NO_DISPONIBLE",
});

export class PasarelaNoDisponible extends PasarelaDePago {
  async cobrar() {
    return RESPUESTA;
  }

  async consultarEstado() {
    return RESPUESTA;
  }
}
