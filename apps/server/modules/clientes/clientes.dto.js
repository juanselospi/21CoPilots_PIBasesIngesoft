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

/** RF-37: lo que el cliente ve de sí mismo. */
export const aClientePropio = (cliente) => ({
  nombre: cliente.nombre,
  correo: cliente.correo,
  cedula: cliente.cedula,
  direccion: cliente.direccion,
  telefonos: cliente.telefonos,
  numeroDeCompras: cliente.numeroDeCompras,
  fechaAceptacionTerminos: cliente.fechaAceptacionTerminos,
});
