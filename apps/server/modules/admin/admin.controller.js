/**
 * CAPA DE API — Controlador de administración.
 *
 * POR IMPLEMENTAR
 *   cerrarSesion         aprobado #15
 *   recuperarContrasena  RF-54
 *   crearUsuario         RF-49, aprobado #6
 *   cambiarParametro     RF-51
 *   consultarBitacora    RF-52
 *   importarExcel        RF-57, RF-58, RF-59
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { COOKIE_DE_SESION } from "../../shared/http/autenticacion.js";
import { aUsuario } from "./admin.dto.js";

export class AdminController {
  #servicio;
  #cookieSegura;

  constructor({ servicio, cookieSegura = false }) {
    this.#servicio = servicio;
    this.#cookieSegura = cookieSegura;
  }

  /** RF-53: POST /sesion con { correo, contrasena }. */
  iniciarSesion = async (peticion, respuesta) => {
    const correo = leerTexto(peticion.body?.correo);
    const contrasena = leerTexto(peticion.body?.contrasena);

    const faltantes = [];
    if (!correo) faltantes.push("correo");
    if (!contrasena) faltantes.push("contrasena");
    if (faltantes.length > 0) {
      throw new EntradaInvalida("Correo y contraseña son obligatorios.", faltantes);
    }

    const { token, venceEn, usuario } = await this.#servicio.iniciarSesion({
      correo,
      contrasena,
    });

    // HttpOnly y SameSite=Lax (RNF-08); Secure según configuración.
    respuesta.cookie(COOKIE_DE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.#cookieSegura,
      path: "/api",
      expires: venceEn,
    });

    respuesta.status(201).json({ datos: aUsuario(usuario) });
  };
}

function leerTexto(valor) {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}
