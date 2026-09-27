/**
 * ADAPTADOR NULO (Null Object) — la pasarela no responde.
 *
 * Existe para satisfacer RNF-06: el 100 % de las operaciones de
 * inventario y de registro de ventas debe completarse aunque los
 * componentes placeholder de pago y facturación estén caídos.
 *
 * En vez de lanzar una excepción que tumbe el flujo, devuelve un
 * resultado explícito. El intento se guarda sin referencia externa, el
 * pedido queda con el pago pendiente y el inventario ya se actualizó.
 *
 * Configurar PASARELA_DE_PAGO=no-disponible es la forma de ejecutar la
 * prueba de verificación de RNF-06.
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
