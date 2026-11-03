/**
 * CAPA DE API — Controlador de clientes.
 *
 * POR IMPLEMENTAR
 *   registrar          RF-32, RF-33, RF-38 — pública, abre la sesión
 *   verMiCuenta        RF-37
 *   corregirMiCuenta   RF-37 — dirección y teléfonos
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
