/**
 * Servicio de administración y seguridad.
 *
 * Falta implementar:
 *   - cuenta de administrador y acceso por rol (RF-49, RF-50)
 *   - modificar precios, descuentos y márgenes (RF-51)
 *   - consultar la bitacora (RF-52), queda pendiente porque el modelo no tiene tabla de bitacora
 *   - recuperación de contraseña (RF-54)
 *
 * A tener en cuenta:
 *   - Cada cambio de parámetro publica PARAMETRO_MODIFICADO después de
 *     guardarlo.
 *   - Los accesos denegados ya los publica el middleware de rol; no hay
 *     que publicarlos otra vez aquí.
 *   - Un usuario que no es administrador ni cliente no tiene rol y no puede
 *     iniciar sesion, ver cambios-siguiente-sprint.md
 *   - La sesión se guarda como hash del token. El token en claro solo
 *     viaja en la cookie.
 *   - Las contraseñas se guardan siempre con hash. Deben tener de 8 a 12
 *     caracteres, con mayúscula, número y carácter especial.
 */

import { CredencialesInvalidas } from "../../shared/errores/errores-de-dominio.js";
import { verificarContrasena } from "./seguridad/contrasenas.js";
import { generarToken, hashearToken } from "./seguridad/tokens-de-sesion.js";

// Si el correo no existe se compara igual contra este hash para que la respuesta tarde lo mismo y no se pueda adivinar qué correos existen.
// PD: Gracias profe Maeva por el TIP que nos dio en redes!!!
const HASH_DE_RELLENO = "$2a$10$1vuYiMqJwRihSl4xTujnxu7/C4bPZQcfg.BGDMjcFy7ox70upM9Ja";

export class AdminService {
  #repositorio;
  #busDeEventos;
  #duracionSesionMinutos;
  #importacionDeExcel;

  constructor({ repositorio, busDeEventos, duracionSesionMinutos = 25, importacionDeExcel }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
    this.#duracionSesionMinutos = duracionSesionMinutos;
    this.#importacionDeExcel = importacionDeExcel;
  }

  // Valida las credenciales y abre la sesion, hace return del token para la cookie
  async iniciarSesion({ correo, contrasena }) {
    const usuario = await this.#repositorio.buscarUsuarioPorCorreo(normalizarCorreo(correo));
    const contrasenaCorrecta = await verificarContrasena(
      contrasena,
      usuario?.contrasenaHash ?? HASH_DE_RELLENO
    );

    if (!usuario || !usuario.rol || !contrasenaCorrecta) {
      throw new CredencialesInvalidas();
    }

    const token = generarToken();
    const venceEn = new Date(Date.now() + this.#duracionSesionMinutos * 60 * 1000);

    await this.#repositorio.crearSesion({
      correoUsuario: usuario.correo,
      tokenHash: hashearToken(token),
      venceEn,
    });

    const { contrasenaHash: _hash, ...datosDelUsuario } = usuario;
    return { token, venceEn, usuario: datosDelUsuario };
  }

  // Identifica la usuario si es dueño de la cookie o tira null si no hay token
  async identificarPorToken(token) {
    if (!token) return null;
    return this.#repositorio.buscarUsuarioPorSesion(hashearToken(token));
  }

  // Importa la hoja de productos
  async importarCatalogo(archivo) {
    return this.#importacionDeExcel.importar(archivo);
  }
}

// El correo se guarda y busca igual en minusculas y sin espacios
const normalizarCorreo = (correo) => correo.trim().toLowerCase();
