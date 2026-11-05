/**
 * Suscriptor — alerta de existencias bajas (RF-16, RN-04).
 *
 * Escucha los movimientos de inventario y levanta la alerta cuando las
 * existencias quedan en el umbral o por debajo. El umbral es fijo e igual
 * para todos los productos (RN-04) y viene de la configuración del
 * servidor; entra por parámetro para poder probarlo.
 *
 * Quien registra el movimiento no conoce este archivo: publica el hecho y
 * sigue. Ese es el desacople que se buscaba, sin infraestructura externa.
 */

import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

export function registrarAlertaDeExistenciasBajas(busDeEventos, { umbral }) {
  return busDeEventos.suscribir(
    EVENTOS.MOVIMIENTO_REGISTRADO,
    async (movimiento) => {
      // Uno descontinuado no se va a reponer, así que no avisa (igual que GET /alertas)
      if (movimiento.estadoDelProducto === "descontinuado") return;
      if (!cruzaElUmbral(movimiento, umbral)) return;

      await busDeEventos.publicar(EVENTOS.EXISTENCIAS_BAJAS, {
        // Quien hizo el movimiento, para que la bitácora sepa a quién atribuirlo
        correoUsuario: movimiento.correoUsuario ?? null,
        sku: movimiento.sku,
        existencias: movimiento.existenciasResultantes,
        umbral,
        fecha: new Date(),
      });
    }
  );
}

/**
 * El movimiento trae `{ sku, cantidad, existenciasResultantes }`, con la
 * cantidad negativa si es una salida. Solo avisa cuando el stock baja al
 * umbral desde arriba, para no repetir la alerta en cada venta siguiente.
 * Si no viene la cantidad, avisa siempre que quede en el umbral o por debajo.
 */
function cruzaElUmbral({ cantidad, existenciasResultantes }, umbral) {
  if (existenciasResultantes > umbral) return false;
  if (typeof cantidad !== "number") return true;
  return existenciasResultantes - cantidad > umbral;
}
