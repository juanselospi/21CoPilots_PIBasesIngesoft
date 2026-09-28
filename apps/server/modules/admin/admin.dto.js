/**
 * DTO + Mapper de administración.
 *
 * RNF-08: ninguna representación de usuario incluye el hash de la
 * contraseña, ni siquiera en las vistas administrativas.
 *
 * POR IMPLEMENTAR
 *   aEntradaDeBitacora()      RF-52 — evento, responsable, fecha
 *   aResultadoDeImportacion() RF-57, RF-58 — importadas y rechazadas con motivo
 *   aParametroComercial()     RF-51
 */

/** Usuario sin credenciales (RF-49, RF-53). */
export const aUsuario = (usuario) => ({
  id: usuario.id,
  correo: usuario.correo,
  nombre: usuario.nombre,
  rol: usuario.rol,
});
