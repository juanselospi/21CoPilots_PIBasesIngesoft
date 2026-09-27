/**
 * CAPA DE API — Controlador de administración.
 *
 * POR IMPLEMENTAR
 *   iniciarSesion        RF-53
 *   cerrarSesion         aprobado #15
 *   recuperarContrasena  RF-54
 *   crearUsuario         RF-49, aprobado #6
 *   cambiarParametro     RF-51
 *   consultarBitacora    RF-52
 *   importarExcel        RF-57, RF-58, RF-59
 */

export class AdminController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }
}
