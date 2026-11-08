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
import { aClienteEnBusqueda, aClientePropio, aMisCreditos, aUsuarioRegistrado } from "./clientes.dto.js";

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

  // GET /admin?q=
  buscarParaAdministracion = async (peticion, respuesta) => {
    const clientes = await this.#servicio.buscarParaAdministracion(peticion.query.q);
    respuesta.json({ datos: clientes.map(aClienteEnBusqueda) });
  };

  // GET /me
  verMiCuenta = async (peticion, respuesta) => {
    const cliente = await this.#servicio.obtenerMiCuenta(peticion.usuario.correo);
    respuesta.json({ datos: aClientePropio(cliente) });
  };

  // GET /me/creditos
  verMisCreditos = async (peticion, respuesta) => {
    respuesta.json({ datos: aMisCreditos(await this.#servicio.obtenerMisCreditos(peticion.usuario.correo)) });
  };

  // PATCH /me con { direccion?, telefonos? }
  corregirMiCuenta = async (peticion, respuesta) => {
    const cliente = await this.#servicio.actualizarMiCuenta(peticion.usuario.correo, peticion.body);
    respuesta.json({ datos: aClientePropio(cliente) });
  };
}
