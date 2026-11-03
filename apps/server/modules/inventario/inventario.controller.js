/**
 * CAPA DE API — Controlador de inventario.
 *
 * Traduce HTTP a llamadas de dominio y de vuelta. No calcula, no consulta
 * la base y no decide reglas.
 *
 * POR IMPLEMENTAR
 *   registrarAjuste      RF-20 — siempre con motivo
 *   listarMovimientos    RF-19
 *   listarAlertas        RF-16 — existencias en el umbral o por debajo
 */

import { aAlerta, aMovimientoRegistrado } from "./inventario.dto.js";

export class InventarioController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }

  // GET /alertas
  listarAlertas = async (_peticion, respuesta) => {
    const { umbral, productos } = await this.#servicio.listarAlertas();
    respuesta.json({ datos: productos.map(aAlerta), meta: { umbral, total: productos.length } });
  };

  // POST /ingresos con { sku, cantidad, costoUnitario }
  registrarIngreso = async (peticion, respuesta) => {
    const movimiento = await this.#servicio.registrarIngreso(peticion.body ?? {}, {
      responsable: peticion.usuario.correo,
    });
    respuesta.status(201).json({ datos: aMovimientoRegistrado(movimiento) });
  };
}
