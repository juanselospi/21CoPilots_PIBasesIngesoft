/**
 * Selector del adaptador de pago.
 *
 * Factory Method parametrizado (§ 4.1): traduce un valor de configuración
 * a una implementación de la interfaz. Sustituir el placeholder por la integración real es agregar
 * una entrada a este mapa, sin tocar pedidos ni checkout (RNF-20).
 */

import { PasarelaSimulada } from "./adaptadores/pasarela-simulada.js";
import { PasarelaNoDisponible } from "./adaptadores/pasarela-no-disponible.js";

const ADAPTADORES = {
  simulada: () => new PasarelaSimulada(),
  "no-disponible": () => new PasarelaNoDisponible(),
  // productiva: () => new PasarelaDelProcesador({ ... }),
};

export function crearPasarelaDePago(nombre) {
  const construir = ADAPTADORES[nombre];

  if (!construir) {
    throw new Error(
      `Adaptador de pago desconocido: "${nombre}". Opciones: ${Object.keys(
        ADAPTADORES
      ).join(", ")}.`
    );
  }

  return construir();
}
