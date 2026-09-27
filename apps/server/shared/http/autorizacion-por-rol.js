/**
 * Control de acceso basado en roles (RF-49, RF-50, RNF-10).
 *
 * Fábrica de middlewares: `exigirRol(ROLES.ADMINISTRADOR)` devuelve el
 * eslabón que protege una ruta (Chain of Responsibility, § 6.1).
 *
 * Los roles son los que admite `admin.usuario.rol`. Si el cliente aprueba
 * las cuentas de empleado (§ 16), se agrega el rol aquí y en una migración
 * nueva; este middleware no cambia.
 *
 * RNF-10 exige que el 100 % de los intentos no autorizados quede
 * registrado: por eso se publica el evento y la bitácora lo escribe, en
 * lugar de que este middleware sepa cómo se persiste una auditoría.
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
        usuarioId: usuario?.id ?? null,
        entidad: "ruta",
        entidadId: ruta.slice(0, 100),
        valorNuevo: { rol: usuario?.rol ?? "anonimo" },
      });

      siguiente(new NoAutorizado(ruta));
    };
}
