/**
 * Ensamblado del módulo de catálogo.
 *
 * Fachada del módulo: el resto del sistema importa solo este archivo y
 * recibe las rutas ya armadas. Las clases internas —repositorio,
 * servicio, pasos de precio— no se exponen hacia afuera.
 *
 * Aquí se ve el orden de las capas: repositorio → servicio → controlador
 * → rutas, con las dependencias siempre hacia adentro.
 */

import { CatalogoRepository } from "./catalogo.repository.js";
import { CatalogoService } from "./catalogo.service.js";
import { CatalogoController } from "./catalogo.controller.js";
import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";

export function crearModuloCatalogo({ pool, negocio }) {
  // El orden de este arreglo ES la fórmula de precio (RN-01).
  // Cuando se resuelva INC-05 con el Excel del cliente, se ajusta aquí.
  const motorDePrecios = new MotorDePrecios([
    new ImportacionPorAranceles(),
    new MargenDeGanancia(),
    new ImpuestoDeVenta(negocio.impuestoDeVenta),
  ]);

  const repositorio = new CatalogoRepository({ pool });
  const servicio = new CatalogoService({ repositorio, motorDePrecios });
  const controlador = new CatalogoController({ servicio });

  return {
    rutas: crearRutasDeCatalogo(controlador),
    // Se exporta para que los módulos de carrito y pedidos reutilicen el
    // mismo cálculo en vez de reimplementarlo.
    motorDePrecios,
  };
}
