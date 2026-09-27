/**
 * Raíz de composición (Composition Root).
 *
 * Único archivo que decide qué implementación concreta usa cada
 * interfaz. Construye una familia coherente de objetos a partir de una
 * sola configuración, que es la intención de Abstract Factory (§ 4.2), y
 * es lo que hace que los módulos dependan de abstracciones y no de clases
 * concretas: sustituir la pasarela simulada por una real (RNF-20) se hace
 * aquí, sin tocar la lógica de pedidos.
 *
 * Orden de construcción:
 *   1. Infraestructura      pool de conexiones y bus de eventos
 *   2. Adaptadores externos pago y facturación (Factory Method)
 *   3. Control de acceso    fábrica de middlewares de rol
 *   4. Módulos              en orden de dependencia
 *   5. Observadores         se registran con los módulos ya construidos
 */

import { crearPool } from "./shared/db/pool.js";
import { BusDeEventos } from "./shared/eventos/bus-de-eventos.js";

export function componerSistema(configuracion) {
  // ---- 1. Infraestructura ----
  // Una sola instancia del pool, inyectada; no es un Singleton (§ 4.5).
  const pool = crearPool(configuracion.baseDeDatos);
  const busDeEventos = new BusDeEventos();

  // Los adaptadores, los módulos y los observadores se agregan aquí,
  // en el orden de construcción de arriba.

  return {
    modulos: {},
    busDeEventos,
    verificarBaseDeDatos: () => pool.query("SELECT 1"),
    cerrar: () => pool.end(),
  };
}
