/**
 * Lo que sale por la API desde el módulo de administración.
 *
 * Ningún usuario sale con el hash de su contraseña, ni siquiera en las
 * vistas del administrador.
 *
 * Falta implementar:
 *   - aEntradaDeBitacora(): evento, responsable y fecha (RF-52)
 *   - aParametroComercial() (RF-51)
 */

import { NOMBRE_DEL_REPORTE, TIPO_DEL_REPORTE } from "./importacion/reporte-de-rechazos.js";

/** Usuario sin credenciales. */
export const aUsuario = (usuario) => ({
  correo: usuario.correo,
  nombre: usuario.nombre,
  rol: usuario.rol,
});

/**
 * Resumen de una importación del Excel. De cada fila rechazada sale solo
 * el número de fila, el código y los motivos, no la fila completa.
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
