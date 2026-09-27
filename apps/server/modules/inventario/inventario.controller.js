/**
 * CAPA DE API — Controlador de inventario.
 *
 * Traduce HTTP a llamadas de dominio y de vuelta. No calcula, no consulta
 * la base y no decide reglas.
 *
 * POR IMPLEMENTAR
 *   registrarIngreso     RF-13 — una sola pantalla, ≤ 4 interacciones (RNF-11)
 *   registrarVenta       RF-17 — venta de canal externo
 *   descontinuar         RF-18
 *   listarMovimientos    RF-19
 *   listarAlertas        RF-16 — existencias en el umbral o por debajo
 */

export class InventarioController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }
}
