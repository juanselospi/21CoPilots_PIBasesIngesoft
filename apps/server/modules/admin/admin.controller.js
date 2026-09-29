/**
 * Controlador de administración: traduce HTTP a llamadas al servicio.
 *
 * Falta implementar:
 *   - cerrarSesion (aprobado #15)
 *   - recuperarContrasena (RF-54)
 *   - crearUsuario (RF-49, aprobado #6)
 *   - cambiarParametro (RF-51)
 *   - consultarBitacora (RF-52)
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

  /** POST /sesion con { correo, contrasena }. */
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

    // HttpOnly para que el JavaScript de la página no pueda leer la cookie.
    // Secure solo en producción, que es donde hay HTTPS.
    respuesta.cookie(COOKIE_DE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.#cookieSegura,
      path: "/api",
      expires: venceEn,
    });

    respuesta.status(201).json({ datos: aUsuario(usuario) });
  };

  /**
   * POST /importaciones con el Excel en el campo `archivo`
   * (multipart/form-data). Responde 200 aunque haya filas rechazadas: el
   * resumen dice cuáles fueron y por qué.
   *
   * Si hubo rechazos, la respuesta trae también el reporte en Excel
   * (en base64) para que la pantalla lo ofrezca como descarga. Así no hay
   * que guardarlo en el servidor ni pedirlo en otra llamada.
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

  /** GET /importaciones/plantilla: descarga la plantilla oficial. */
  descargarPlantilla = (_peticion, respuesta, siguiente) => {
    respuesta.download(RUTA_DE_LA_PLANTILLA, "plantilla-de-productos.xlsx", (error) => {
      if (error) siguiente(error);
    });
  };
}

function leerTexto(valor) {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}
