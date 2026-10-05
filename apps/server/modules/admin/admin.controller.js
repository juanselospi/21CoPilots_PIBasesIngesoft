/**
 * Controlador de administración: traduce HTTP a llamadas al servicio.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { COOKIE_DE_SESION } from "../../shared/http/autenticacion.js";
import { aUsuario, aResultadoDeImportacion } from "./admin.dto.js";
import { CAMPO_DEL_ARCHIVO } from "./importacion/recibir-excel.js";
import { RUTA_DE_LA_PLANTILLA } from "./importacion/columnas.js";
import { generarReporteDeRechazos } from "./importacion/reporte-de-rechazos.js";

export class AdminController {
  #servicio;
  #cookieSegura;

  constructor({ servicio, cookieSegura = false }) {
    this.#servicio = servicio;
    this.#cookieSegura = cookieSegura;
  }

  // POST / sesion con { correo, contrasena }
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

    // HttpOnly para que el JavaScript de la pagina no pueda leer la cookie
    respuesta.cookie(COOKIE_DE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.#cookieSegura, // Secure solo en produccion que es donde hay HTTPS
      path: "/api",
      expires: venceEn,
    });

    respuesta.status(201).json({ datos: aUsuario(usuario) });
  };

  // GET / sesion del usuario de la cookie con la misma forma que al iniciar sesion
  consultarSesion = (peticion, respuesta) => {
    respuesta.json({ datos: aUsuario(peticion.usuario) });
  };

  /**
   * POST /importaciones con el Excel. Responde 200 aunque haya filas rechazadas: el
   * resumen dice cuáles fueron y por qué.
   */
  importarExcel = async (peticion, respuesta) => {
    if (!peticion.file) {
      throw new EntradaInvalida(
        `Falta el archivo de Excel en el campo "${CAMPO_DEL_ARCHIVO}".`,
        [CAMPO_DEL_ARCHIVO]
      );
    }

    const resultado = await this.#servicio.importarCatalogo(peticion.file.buffer);
    const reporte =
      resultado.rechazadas.length > 0 ? await generarReporteDeRechazos(resultado.rechazadas) : null;

    respuesta.json({ datos: aResultadoDeImportacion(resultado, reporte) });
  };

  // GET / importaciones/ plantilla de descarga
  descargarPlantilla = (_peticion, respuesta, siguiente) => {
    respuesta.download(RUTA_DE_LA_PLANTILLA, "plantilla-de-productos.xlsx", (error) => {
      if (error) siguiente(error);
    });
  };
}

function leerTexto(valor) {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}
