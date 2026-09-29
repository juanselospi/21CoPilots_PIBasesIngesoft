/**
 * Arma el módulo de administración.
 *
 * Expone el repositorio porque lo usa el suscriptor de la bitácora, y el
 * servicio porque otros módulos le piden los parámetros de negocio.
 *
 * Recibe catálogo e inventario porque la importación del Excel guarda
 * los productos y sus existencias a través de ellos.
 */

import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";
import { AdminController } from "./admin.controller.js";
import { crearRutasDeAdmin } from "./admin.routes.js";
import { ImportacionDeExcel } from "./importacion/importacion-de-excel.js";
import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

export function crearModuloAdmin({
  pool,
  busDeEventos,
  exigirRol,
  sesion,
  catalogo,
  inventario,
  negocio,
}) {
  const repositorio = new AdminRepository({ pool });

  // Un producto nuevo nace con existencia en 0: la hoja no trae cantidades
  // y el inventario se carga después. Todo en la misma transacción.
  const guardarProducto = async (cliente, producto) => {
    const guardado = await catalogo.guardarProductoPorSku(cliente, producto);
    if (guardado.insertado) await inventario.crearExistenciaSiFalta(cliente, guardado.id);
    return guardado;
  };

  const importacionDeExcel = new ImportacionDeExcel({
    guardarProducto,
    enTransaccion: (trabajo) => enTransaccion(pool, trabajo),
    impuestoDeVenta: negocio.impuestoDeVenta,
  });
  const servicio = new AdminService({
    repositorio,
    busDeEventos,
    duracionSesionHoras: sesion.duracionHoras,
    importacionDeExcel,
  });
  const controlador = new AdminController({
    servicio,
    cookieSegura: sesion.cookieSegura,
  });

  return {
    rutas: crearRutasDeAdmin(controlador, { exigirRol }),
    servicio,
    repositorio,
  };
}
