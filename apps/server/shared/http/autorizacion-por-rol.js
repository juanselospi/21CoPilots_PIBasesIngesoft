/**
 * Control de acceso basado en roles.
 *
 * Fábrica de middlewares: `exigirRol(ROLES.ADMINISTRADOR)` devuelve el
 * eslabón que protege una ruta (Chain of Responsibility).
 *
 * El rol no es una columna: sale de la tabla donde este el correo del usuario,
 * admin.administrador o clientes.cliente.
 */

import { NoAutorizado } from "../errores/errores-de-dominio.js";
import { EVENTOS } from "../eventos/eventos-de-dominio.js";

export const ROLES = Object.freeze({
  ADMINISTRADOR: "administrador",
  CLIENTE: "cliente",
});

export function crearExigirRol(busDeEventos) {
  return (...rolesPermitidos) =>
    async (peticion, _respuesta, siguiente) => {
      const usuario = peticion.usuario;

      if (usuario && rolesPermitidos.includes(usuario.rol)) {
        siguiente();
        return;
      }
      siguiente(await denegar(busDeEventos, peticion));
    };
}

/**
 * Los empleados también son administradores; esto separa lo que solo hace
 * el dueño, como crear cuentas y configurar el negocio.
 */
export function crearExigirPropietario(busDeEventos) {
  return async (peticion, _respuesta, siguiente) => {
    const usuario = peticion.usuario;

    if (usuario?.rol === ROLES.ADMINISTRADOR && usuario.esPropietario) {
      siguiente();
      return;
    }
    siguiente(await denegar(busDeEventos, peticion));
  };
}

// RNF-10: todo intento sin permiso queda registrado
async function denegar(busDeEventos, peticion) {
  const usuario = peticion.usuario;
  const ruta = `${peticion.method} ${peticion.originalUrl}`;

  await busDeEventos.publicar(EVENTOS.ACCESO_DENEGADO, {
    correoUsuario: usuario?.correo ?? null,
    entidad: "ruta",
    entidadId: ruta.slice(0, 100),
    valorNuevo: { rol: usuario?.rol ?? "anonimo" },
  });
  return new NoAutorizado(ruta);
}
