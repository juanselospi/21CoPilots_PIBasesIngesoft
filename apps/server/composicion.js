/**
 * Raíz de composición (Composition Root).
 *
 * Único archivo que decide qué implementación concreta usa cada
 * interfaz. Construye una familia coherente de objetos a partir de una
 * sola configuración, que es la intención de Abstract Factory (§ 4.2), y
 * es lo que hace que los módulos dependan de abstracciones y no de clases
 * concretas: sustituir la pasarela simulada por una real (RNF-20) se hace
 * aquí, sin tocar la lógica de pedidos.
 *
 * Orden de construcción:
 *   1. Infraestructura      pool de conexiones y bus de eventos
 *   2. Adaptadores externos pago y facturación (Factory Method)
 *   3. Control de acceso    fábrica de middlewares de rol
 *   4. Módulos              en orden de dependencia
 *   5. Observadores         se registran con los módulos ya construidos
 */

import { crearPool } from "./shared/db/pool.js";
import { BusDeEventos } from "./shared/eventos/bus-de-eventos.js";
import { crearExigirRol } from "./shared/http/autorizacion-por-rol.js";

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
  // ---- 1. Infraestructura ----
  // Una sola instancia del pool, inyectada; no es un Singleton (§ 4.5).
  const pool = crearPool(configuracion.baseDeDatos);
  const busDeEventos = new BusDeEventos();

  // ---- 2. Adaptadores de los sistemas externos (Bridge, § 5.2) ----
  const pasarelaDePago = crearPasarelaDePago(
    configuracion.adaptadores.pasarelaDePago
  );
  const facturacionElectronica = crearFacturacionElectronica(
    configuracion.adaptadores.facturacionElectronica
  );

  // ---- 3. Control de acceso por rol ----
  const exigirRol = crearExigirRol(busDeEventos);

  // ---- 4. Módulos, en orden de dependencia ----
  // admin va primero porque clientes lee de él los parámetros de negocio.
  const admin = crearModuloAdmin({ pool, busDeEventos, exigirRol });

  const catalogo = crearModuloCatalogo({
    pool,
    negocio: configuracion.negocio,
  });

  const inventario = crearModuloInventario({ pool, busDeEventos, exigirRol });

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

  // ---- 5. Observadores del bus de eventos (§ 6.2) ----
  registrarAlertaDeExistenciasBajas(busDeEventos, {
    umbral: configuracion.negocio.umbralDeExistenciasBajas,
  });
  registrarBitacoraDeAuditoria(busDeEventos, {
    repositorio: admin.repositorio,
  });

  return {
    modulos: { admin, catalogo, inventario, clientes, pedidos, reportes },
    busDeEventos,
    verificarBaseDeDatos: () => pool.query("SELECT 1"),
    cerrar: () => pool.end(),
  };
}
