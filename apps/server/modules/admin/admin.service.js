/**
 * CAPA DE DOMINIO — Administración y seguridad.
 *
 * POR IMPLEMENTAR
 *   RF-49, RF-50  Cuenta de administrador y acceso por rol
 *   RF-51         Modificar precios, descuentos y márgenes
 *   RF-52         Bitácora de auditoría (el observador ya existe)
 *   RF-53, RF-54  Inicio de sesión y recuperación de contraseña
 *   RF-57..RF-59  Importación del Excel (SUP-01)
 *
 * Reglas al implementar:
 *   · Todo cambio de parámetro publica PARAMETRO_MODIFICADO después de
 *     guardarlo; la bitácora lo registra sola (§ 6.2).
 *   · RNF-10: los intentos no autorizados ya los registra el middleware
 *     de rol. No duplicar ese registro aquí.
 *   · La importación extiende `importacion/plantilla-de-importacion.js`
 *     (Template Method, § 6.6); no reescribir el bucle de importación.
 *   · RNF-08: hash antes de persistir cualquier contraseña. La política
 *     de contraseña es de 8 a 12 caracteres, con mayúscula, número y
 *     carácter especial (aprobado #15).
 */

import { ErrorDeDominio } from "../../shared/errores/errores-de-dominio.js";

export class AdminService {
  #repositorio;
  #busDeEventos;

  constructor({ repositorio, busDeEventos }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
  }

  /**
   * Parámetro de negocio numérico (DD-14). Lo usa, por ejemplo, el módulo
   * de clientes para leer `monto_minimo_descuento`.
   */
  async obtenerNumero(clave) {
    const valor = await this.#repositorio.obtenerParametro(clave);
    const numero = Number(valor);

    if (valor === null || !Number.isFinite(numero)) {
      throw new ErrorDeDominio(
        `El parámetro de negocio "${clave}" no existe o no es numérico.`,
        { codigo: "PARAMETRO_INVALIDO" }
      );
    }
    return numero;
  }
}
