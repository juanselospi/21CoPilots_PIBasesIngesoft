/**
 * CAPA DE DOMINIO — Clientes y niveles de fidelidad.
 *
 * POR IMPLEMENTAR
 *   RF-32, RF-33  Registro del cliente en su primera compra (RN-07)
 *   RF-34         Cálculo del nivel por recompra (RN-08)
 *   RF-35, RF-36  Descuento por nivel y pago adelantado (RN-09, RN-10)
 *   RF-37         Consulta de la cuenta y sus pedidos
 *   RF-38         Aceptación de términos con fecha (RN-19, RNF-16)
 *
 * Reglas al implementar:
 *   · El descuento se delega en la estrategia (Strategy, § 6.5b); no
 *     duplicar la escala de niveles en este archivo.
 *   · RNF-16 (Ley 8968): el consentimiento se registra con fecha y con la
 *     versión vigente de los términos (`version_terminos_vigente`).
 *   · RNF-08: la contraseña se transforma con hash antes de que llegue a
 *     cualquier repositorio.
 */

import { DescuentoPorNivel } from "./descuentos/estrategia-de-descuento.js";

export class ClientesService {
  #repositorio;
  #parametrosDeNegocio;

  constructor({ repositorio, parametrosDeNegocio }) {
    this.#repositorio = repositorio;
    this.#parametrosDeNegocio = parametrosDeNegocio;
  }

  /**
   * Construye la estrategia con los valores vigentes en las tablas. Se
   * arma en cada uso, así un cambio del administrador aplica de inmediato
   * sin reiniciar el servidor (aprobado #10, DD-14).
   */
  async obtenerEstrategiaDeDescuento() {
    const [escala, montoMinimo] = await Promise.all([
      this.#repositorio.listarNivelesDeFidelidad(),
      this.#parametrosDeNegocio.obtenerNumero("monto_minimo_descuento"),
    ]);

    return new DescuentoPorNivel({ escala, montoMinimo });
  }
}
