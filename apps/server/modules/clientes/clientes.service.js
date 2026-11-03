/**
 * CAPA DE DOMINIO — Clientes y niveles de fidelidad.
 *
 * Toda cuenta nueva que se registra desde la tienda es de cliente.
 *
 * POR IMPLEMENTAR
 *   RF-34         Cálculo del nivel por recompra (RN-08)
 *   RF-35, RF-36  Descuento y pago adelantado (RN-09, RN-10)
 *   RF-37         Consulta de la cuenta y sus pedidos
 *
 * El descuento sale de `pedidos.oferta` (vigencia, monto mínimo y nivel
 * mínimo), no de un porcentaje fijo por nivel: esa estrategia se hace
 * desde cero cuando se implemente.
 */

import { DatoDuplicado } from "../../shared/errores/errores-de-dominio.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";
import { validarRegistro } from "./validar-registro.js";

const MENSAJE_DE_REPETIDO = Object.freeze({
  correo: "Ya existe una cuenta con ese correo.",
  cedula: "Ya existe una cuenta con esa cédula.",
});

export class ClientesService {
  #repositorio;
  #hashearContrasena;
  #abrirSesion;

  // La contraseña y la sesión las maneja admin; llegan desde composicion.js
  constructor({ repositorio, hashearContrasena, abrirSesion }) {
    this.#repositorio = repositorio;
    this.#hashearContrasena = hashearContrasena;
    this.#abrirSesion = abrirSesion;
  }

  /**
   * RF-32, RF-33, RF-38: crea la cuenta y deja la sesión abierta.
   * @returns el token y el vencimiento para la cookie, y el usuario
   * @throws {EntradaInvalida} con todos los campos que tienen problemas
   * @throws {DatoDuplicado} si el correo o la cédula ya tienen cuenta
   */
  async registrar(datos) {
    const { contrasena, ...cliente } = validarRegistro(datos);

    const repetidos = await this.#repositorio.registrar({
      ...cliente,
      contrasenaHash: await this.#hashearContrasena(contrasena),
    });
    if (repetidos.length > 0) {
      throw new DatoDuplicado(repetidos.map((campo) => MENSAJE_DE_REPETIDO[campo]).join(" "), repetidos);
    }

    return this.#abrirSesion({ correo: cliente.correo, nombre: cliente.nombre, rol: ROLES.CLIENTE });
  }
}
