/**
 * Lo que sale por la API desde el módulo de administración.
 */

import { NOMBRE_DEL_REPORTE, TIPO_DEL_REPORTE } from "./importacion/reporte-de-rechazos.js";

/** Usuario sin credenciales. `esPropietario` dice si el panel le muestra la gestión de empleados. */
export const aUsuario = (usuario) => ({
  correo: usuario.correo,
  nombre: usuario.nombre,
  rol: usuario.rol,
  esPropietario: usuario.esPropietario === true,
});

/** Una cuenta de administrador para la pantalla de empleados. */
export const aAdministrador = (cuenta) => ({
  correo: cuenta.correo,
  nombre: cuenta.nombre,
  esPropietario: cuenta.esPropietario,
  activo: cuenta.activo,
  creadoPor: cuenta.creadoPor,
});

/**
 * Resumen de una importación del Excel
 *
 * `reporte` es el Excel de filas rechazadas, o debe ser null si no hubo rechazos.
 */
export const aResultadoDeImportacion = (resultado, reporte = null) => ({
  leidas: resultado.leidas,
  importadas: resultado.importadas,
  actualizadas: resultado.actualizadas,
  rechazadas: resultado.rechazadas.map(({ linea, fila, motivos }) => ({
    fila: linea,
    codigoSku: fila.codigoSku ?? null,
    motivos,
  })),
  reporte: reporte && {
    nombreArchivo: NOMBRE_DEL_REPORTE,
    tipo: TIPO_DEL_REPORTE,
    contenidoBase64: reporte.toString("base64"),
  },
});

/** Fila de la bitácora para el panel. */
export const aRegistroDeBitacora = (registro) => ({
  fecha: registro.fecha,
  usuario: registro.correoUsuario,
  nombreUsuario: registro.nombreUsuario ?? null,
  evento: registro.evento,
  entidad: registro.entidad,
  entidadId: registro.entidadId,
  valorAnterior: registro.valorAnterior,
  valorNuevo: registro.valorNuevo,
});
