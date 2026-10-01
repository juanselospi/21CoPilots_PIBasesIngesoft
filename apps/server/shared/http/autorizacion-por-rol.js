/**
 * Control de acceso basado en roles (RF-49, RF-50, RNF-10).
 *
 * Fábrica de middlewares: `exigirRol(ROLES.ADMINISTRADOR)` devuelve el
 * eslabón que protege una ruta (Chain of Responsibility, § 6.1).
 *
 * El rol no es una columna: sale de la tabla donde este el correo del usuario,
 * admin.administrador o clientes.cliente. Si se aprueban las cuentas de empleado
 * se agrega el rol aqui y su tabla en una migracion nueva, este middleware no cambia.
 *
 * RNF-10 exige que el 100 % de los intentos no autorizados quede
 * registrado: por eso se publica el evento en lugar de que este middleware
 * sepa como se guarda una auditoria. Donde se guarda la bitacora sigue por
 * definir, ver cambios-siguiente-sprint.md
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

      const ruta = `${peticion.method} ${peticion.originalUrl}`;

      await busDeEventos.publicar(EVENTOS.ACCESO_DENEGADO, {
        correoUsuario: usuario?.correo ?? null,
        entidad: "ruta",
        entidadId: ruta.slice(0, 100),
        valorNuevo: { rol: usuario?.rol ?? "anonimo" },
      });

      siguiente(new NoAutorizado(ruta));
    };
}
