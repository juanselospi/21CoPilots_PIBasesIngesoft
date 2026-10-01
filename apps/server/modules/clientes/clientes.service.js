/**
 * CAPA DE DOMINIO — Clientes y niveles de fidelidad.
 *
 * PENDIENTE: adaptar al EER corregido antes de implementar (ver cambios-siguiente-sprint.md):
 *   - el descuento ahora sale de una oferta de pedidos.oferta: aplica si esta vigente
 *     (fecha_inicio a fecha_fin), el monto llega a monto_minimo y el nivel del cliente es
 *     al menos nivel_fidelidad_minimo. La estrategia de descuento se hace desde cero,
 *     la anterior (porcentaje por nivel) se borro porque el modelo ya no la soporta
 *   - la escala que convierte num_compras en nivel sigue por definir
 *   - RF-38 y version_terminos_vigente no tienen donde guardarse
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

export class ClientesService {
  #repositorio;

  constructor({ repositorio }) {
    this.#repositorio = repositorio;
  }
}
