/**
 * Raíz de composición (Composition Root).
 *
 * Aquí se arma todo el sistema y es el único lugar que decide qué
 * implementación concreta se usa. Por ejemplo, para cambiar la pasarela
 * de pago simulada por una real solo hay que tocar este archivo, no la
 * lógica de pedidos.
 *
 * El orden importa: primero la infraestructura (pool y bus de eventos),
 * luego los adaptadores externos, el control de acceso, los módulos y al
 * final los observadores del bus, que necesitan los módulos ya armados.
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
import { registrarBitacoraDeAuditoria } from "./modules/admin/suscriptores/bitacora-de-auditoria.js";

export function componerSistema(configuracion) {
  // Un solo pool para todo el sistema. Se pasa a cada módulo en vez de ser
  // global, así una prueba puede usar su propia base.
  const pool = crearPool(configuracion.baseDeDatos);
  const busDeEventos = new BusDeEventos();

  // Sistemas externos (por ahora simulados).
  const pasarelaDePago = crearPasarelaDePago(
    configuracion.adaptadores.pasarelaDePago
  );
  const facturacionElectronica = crearFacturacionElectronica(
    configuracion.adaptadores.facturacionElectronica
  );

  const exigirRol = crearExigirRol(busDeEventos);

  // Los módulos van en orden de dependencia. catalogo e inventario van
  // antes que admin porque la importación del Excel guarda productos y
  // existencias a través de ellos. admin va antes que clientes porque
  // clientes le pide los parámetros de negocio.
  const catalogo = crearModuloCatalogo({
    pool,
    negocio: configuracion.negocio,
  });

  const inventario = crearModuloInventario({ pool, busDeEventos, exigirRol });

  const admin = crearModuloAdmin({
    pool,
    busDeEventos,
    exigirRol,
    sesion: configuracion.sesion,
    catalogo,
    inventario,
    negocio: configuracion.negocio,
  });

  // Las sesiones son de admin, así que admin es quien dice de quién es
  // cada cookie.
  const identificarUsuario = crearIdentificarUsuario((token) =>
    admin.servicio.identificarPorToken(token)
  );

  const clientes = crearModuloClientes({
    pool,
    parametrosDeNegocio: admin.servicio,
    exigirRol,
  });

  const pedidos = crearModuloPedidos({
    pool,
    busDeEventos,
    inventario: inventario.servicio,
    clientes: clientes.servicio,
    motorDePrecios: catalogo.motorDePrecios,
    pasarelaDePago,
    facturacionElectronica,
  });

  const reportes = crearModuloReportes({ pool, exigirRol });

  // Observadores del bus de eventos.
  registrarAlertaDeExistenciasBajas(busDeEventos, {
    umbral: configuracion.negocio.umbralDeExistenciasBajas,
  });
  registrarBitacoraDeAuditoria(busDeEventos, {
    repositorio: admin.repositorio,
  });

  return {
    modulos: { admin, catalogo, inventario, clientes, pedidos, reportes },
    identificarUsuario,
    busDeEventos,
    verificarBaseDeDatos: () => pool.query("SELECT 1"),
    cerrar: () => pool.end(),
  };
}
