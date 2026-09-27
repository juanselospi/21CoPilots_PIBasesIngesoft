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
      if (movimiento.existenciasResultantes > umbral) return;

      await busDeEventos.publicar(EVENTOS.EXISTENCIAS_BAJAS, {
        productoId: movimiento.productoId,
        sku: movimiento.sku,
        existencias: movimiento.existenciasResultantes,
        umbral,
        fecha: new Date(),
      });
    }
  );
}
