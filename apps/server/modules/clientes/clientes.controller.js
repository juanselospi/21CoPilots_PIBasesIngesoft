/**
 * CAPA DE API — Controlador de clientes.
 *
 * POR IMPLEMENTAR
 *   verMiCuenta        RF-37
 *   aceptarTerminos    RF-38
 *   consultarNivel     RF-34, RF-35
 *   listarClientes     aprobado #2 — solo administrador
 *   corregirDatos      aprobado #3 — solo administrador
 */

export class ClientesController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }
}
