/**
 * Arma el módulo de administración.
 *
 * Expone el servicio porque composicion.js lo usa para saber de quien es cada cookie.
 *
 * Recibe catalogo porque la importacion del Excel guarda los productos a traves de el.
 */

import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";
import { AdminController } from "./admin.controller.js";
import { crearRutasDeAdmin } from "./admin.routes.js";
import { ImportacionDeExcel } from "./importacion/importacion-de-excel.js";
import { crearRecibirExcel } from "./importacion/recibir-excel.js";
import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";
import { hashearContrasena } from "./seguridad/contrasenas.js";
import { crearExigirPropietario } from "../../shared/http/autorizacion-por-rol.js";

export function crearModuloAdmin({
  pool,
  busDeEventos,
  exigirRol,
  sesion,
  importacion,
  catalogo,
  negocio,
}) {
  const repositorio = new AdminRepository({ pool });

  const importacionDeExcel = new ImportacionDeExcel({
    guardarProducto: catalogo.guardarProductoPorSku,
    enTransaccion: (trabajo) => enTransaccion(pool, trabajo),
    impuestoDeVenta: negocio.impuestoDeVenta,
  });
  const servicio = new AdminService({
    repositorio,
    busDeEventos,
    duracionSesionMinutos: sesion.duracionMinutos,
    renovarSesion: sesion.renovar,
    importacionDeExcel,
  });
  const controlador = new AdminController({
    servicio,
    cookieSegura: sesion.cookieSegura,
  });

  return {
    rutas: crearRutasDeAdmin(controlador, {
      exigirRol,
      exigirPropietario: crearExigirPropietario(busDeEventos),
      recibirExcel: crearRecibirExcel({ tamanoMaximoMb: importacion.tamanoMaximoMb }),
    }),
    servicio,
    // El registro de clientes guarda la contraseña y abre la sesión igual que aquí
    cuentas: {
      hashearContrasena,
      abrirSesion: (usuario) => servicio.abrirSesion(usuario),
    },
  };
}
