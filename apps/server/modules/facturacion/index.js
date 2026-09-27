/**
 * Selector del adaptador de facturación electrónica.
 *
 * Factory Method parametrizado (§ 4.1), igual que el de pagos. Solo lo
 * llama `composicion.js` (§ 15, convención 2).
 */

import { FacturacionSimulada } from "./adaptadores/facturacion-simulada.js";
import { FacturacionNoDisponible } from "./adaptadores/facturacion-no-disponible.js";

const ADAPTADORES = {
  simulada: () => new FacturacionSimulada(),
  "no-disponible": () => new FacturacionNoDisponible(),
  // hacienda: () => new FacturacionHacienda({ ... }),
};

export function crearFacturacionElectronica(nombre) {
  const construir = ADAPTADORES[nombre];

  if (!construir) {
    throw new Error(
      `Adaptador de facturación desconocido: "${nombre}". Opciones: ${Object.keys(
        ADAPTADORES
      ).join(", ")}.`
    );
  }

  return construir();
}
