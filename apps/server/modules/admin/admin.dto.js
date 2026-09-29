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

/** Usuario sin credenciales. */
export const aUsuario = (usuario) => ({
  id: usuario.id,
  correo: usuario.correo,
  nombre: usuario.nombre,
  rol: usuario.rol,
});

/**
 * Resumen de una importación del Excel. De cada fila rechazada sale solo
 * el número de fila, el código y los motivos, no la fila completa.
 */
export const aResultadoDeImportacion = (resultado) => ({
  leidas: resultado.leidas,
  importadas: resultado.importadas,
  actualizadas: resultado.actualizadas,
  rechazadas: resultado.rechazadas.map(({ linea, fila, motivos }) => ({
    fila: linea,
    codigoSku: fila.codigoSku ?? null,
    motivos,
  })),
});
