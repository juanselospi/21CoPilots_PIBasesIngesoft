/**
 * DTO + Mapper de clientes.
 *
 * Contiene datos personales sujetos a la Ley 8968 (RES-05, RNF-16): la
 * lista blanca es la que impide exponer más de lo necesario, y bajo
 * ninguna circunstancia se incluye el hash de la contraseña.
 *
 * POR IMPLEMENTAR
 *   aClienteAdministrativo()  aprobado #2 — lista de clientes del panel
 *   aNivelDeFidelidad()       RF-34 — nivel, compras acumuladas, descuento
 */

/** Lo mismo que devuelve iniciar sesión, para que la tienda lo trate igual. */
export const aUsuarioRegistrado = (usuario) => ({
  correo: usuario.correo,
  nombre: usuario.nombre,
  rol: usuario.rol,
});

/** Lo justo para reconocer al cliente en el buscador del panel. */
export const aClienteEnBusqueda = (cliente) => ({
  correo: cliente.correo,
  nombre: cliente.nombre,
  cedula: cliente.cedula,
});

/** RF-37: lo que el cliente ve de sí mismo. */
export const aClientePropio = (cliente) => ({
  nombre: cliente.nombre,
  correo: cliente.correo,
  cedula: cliente.cedula,
  direccion: cliente.direccion,
  telefonos: cliente.telefonos,
  numeroDeCompras: cliente.numeroDeCompras,
  fechaAceptacionTerminos: cliente.fechaAceptacionTerminos,
  saldoCredito: cliente.saldoCredito ?? 0,
  moneda: "USD",
});

/** El saldo a favor y de dónde salió. */
export const aMisCreditos = (creditos) => ({
  saldo: creditos.saldo,
  otorgado: creditos.otorgado,
  usado: creditos.usado,
  moneda: "USD",
  movimientos: creditos.movimientos.map((movimiento) => ({
    tipo: movimiento.tipo,
    fecha: movimiento.fecha,
    monto: movimiento.monto,
    motivo: movimiento.motivo,
    numCarrito: movimiento.numCarrito,
  })),
});
