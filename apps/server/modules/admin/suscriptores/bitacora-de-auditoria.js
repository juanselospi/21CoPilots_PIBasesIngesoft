/**
 * Suscriptor — bitácora de auditoría (RF-52, RNF-10).
 *
 * Observador del bus de eventos (§ 6.2). Un solo suscriptor registra
 * todos los hechos auditables: agregar un evento a la lista es una línea,
 * y no hay que tocar el código que lo produce.
 *
 * Escribe a través del repositorio de administración, no con SQL propio,
 * porque solo ese repositorio escribe en el esquema `admin` (§ 9.3).
 *
 * Forma esperada de los datos del evento (todos opcionales):
 *   { usuarioId, entidad, entidadId, valorAnterior, valorNuevo }
 * Si el evento no trae `valorNuevo`, se guarda el evento completo.
 */

import { EVENTOS } from "../../../shared/eventos/eventos-de-dominio.js";

/** Hechos que quedan registrados en la bitácora. */
const EVENTOS_AUDITABLES = [
  EVENTOS.PARAMETRO_MODIFICADO,
  EVENTOS.ACCESO_DENEGADO,
  EVENTOS.MOVIMIENTO_REGISTRADO,
  EVENTOS.PEDIDO_CONFIRMADO,
  EVENTOS.PEDIDO_CANCELADO,
  EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO,
];

export function registrarBitacoraDeAuditoria(busDeEventos, { repositorio }) {
  const cancelaciones = EVENTOS_AUDITABLES.map((evento) =>
    busDeEventos.suscribir(evento, async (datos = {}) => {
      await repositorio.registrarEnBitacora({
        accion: evento,
        usuarioId: datos.usuarioId ?? null,
        entidad: datos.entidad ?? null,
        entidadId: datos.entidadId ?? null,
        valorAnterior: datos.valorAnterior ?? null,
        valorNuevo: datos.valorNuevo ?? datos,
      });
    })
  );

  return () => cancelaciones.forEach((cancelar) => cancelar());
}
