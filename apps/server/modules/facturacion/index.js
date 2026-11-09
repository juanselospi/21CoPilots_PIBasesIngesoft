/**
 * Selector del adaptador de facturación electrónica.
 *
 * Factory Method parametrizado, igual que el de pagos. Solo lo
 * llama `composicion.js`.
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

export { FacturacionRepository } from "./facturacion.repository.js";
