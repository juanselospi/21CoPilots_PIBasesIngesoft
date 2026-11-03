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

import { escribirCookieDeSesion } from "../../shared/http/autenticacion.js";
import { aUsuarioRegistrado } from "./clientes.dto.js";

export class ClientesController {
  #servicio;
  #cookieSegura;

  constructor({ servicio, cookieSegura = false }) {
    this.#servicio = servicio;
    this.#cookieSegura = cookieSegura;
  }

  // POST / pública. Responde como iniciar sesión: 201, la cookie y el usuario
  registrar = async (peticion, respuesta) => {
    const { token, venceEn, usuario } = await this.#servicio.registrar(peticion.body ?? {});

    escribirCookieDeSesion(respuesta, token, venceEn, { segura: this.#cookieSegura });
    respuesta.status(201).json({ datos: aUsuarioRegistrado(usuario) });
  };
}
