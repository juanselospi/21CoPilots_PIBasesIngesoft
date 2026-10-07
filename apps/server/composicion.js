/**
 * Raíz de composición (Composition Root).
 */

import { crearPool } from "./shared/db/pool.js";
import { BusDeEventos } from "./shared/eventos/bus-de-eventos.js";
import { crearExigirRol } from "./shared/http/autorizacion-por-rol.js";
import { crearIdentificarUsuario } from "./shared/http/autenticacion.js";

import { crearPasarelaDePago } from "./modules/pagos/index.js";
import { crearFacturacionElectronica } from "./modules/facturacion/index.js";

import { crearModuloAdmin } from "./modules/admin/index.js";
import { crearModuloCatalogo } from "./modules/catalogo/index.js";
import { crearModuloInventario } from "./modules/inventario/index.js";
import { crearModuloClientes } from "./modules/clientes/index.js";
import { crearModuloPedidos } from "./modules/pedidos/index.js";
import { crearModuloReportes } from "./modules/reportes/index.js";

import { registrarAlertaDeExistenciasBajas } from "./modules/inventario/suscriptores/alerta-de-existencias-bajas.js";

export function componerSistema(configuracion) {
  const pool = crearPool(configuracion.baseDeDatos);
  const busDeEventos = new BusDeEventos();

  // Sistemas externos (por ahora solo son simulados)
  const pasarelaDePago = crearPasarelaDePago(
    configuracion.adaptadores.pasarelaDePago
  );

  const facturacionElectronica = crearFacturacionElectronica(
    configuracion.adaptadores.facturacionElectronica
  );

  const exigirRol = crearExigirRol(busDeEventos);

  // Los modulos van en orden de dependencia
  // Catalogo va antes que admin porque la importacion del excel guarda los productos a traves del catalogo
  const catalogo = crearModuloCatalogo({
    pool,
    exigirRol,
    umbralDeExistenciasBajas: configuracion.negocio.umbralDeExistenciasBajas,
  });

  const inventario = crearModuloInventario({ pool, busDeEventos, exigirRol });

  const admin = crearModuloAdmin({
    pool,
    busDeEventos,
    exigirRol,
    sesion: configuracion.sesion,
    importacion: configuracion.importacion,
    catalogo,
    negocio: configuracion.negocio,
  });

  // Las sesiones son del admin, por eso admin es quien dice de quien es cada cookie
  const identificarUsuario = crearIdentificarUsuario((token) =>
    admin.servicio.identificarPorToken(token)
  );

  const clientes = crearModuloClientes({ pool, exigirRol });

  const pedidos = crearModuloPedidos({
    pool,
    busDeEventos,
    inventario: inventario.servicio,
    clientes: clientes.servicio,
    motorDePrecios: catalogo.motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
  });

  const reportes = crearModuloReportes({
    pool,
    exigirRol,
    motorDePrecios: catalogo.motorDePrecios,
  });

  // Observadores del bus de eventos para registros
  // No hay suscriptor de bitacora hasta definir donde se guarda, ver cambios-siguiente-sprint.md
  registrarAlertaDeExistenciasBajas(busDeEventos, {
    umbral: configuracion.negocio.umbralDeExistenciasBajas,
  });

  return {
    modulos: { admin, catalogo, inventario, clientes, pedidos, reportes },
    identificarUsuario,
    busDeEventos,
    verificarBaseDeDatos: () => pool.query("SELECT 1"),
    cerrar: () => pool.end(),
  };
}
