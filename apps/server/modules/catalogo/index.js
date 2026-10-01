/**
 * Arma el módulo de catálogo.
 *
 * El resto del sistema importa solo este archivo. El repositorio, el
 * servicio y los pasos de precio quedan adentro; hacia afuera solo salen
 * las rutas y lo que otros módulos necesitan.
 */

import { CatalogoRepository } from "./catalogo.repository.js";
import { CatalogoService } from "./catalogo.service.js";
import { CatalogoController } from "./catalogo.controller.js";
import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";

export function crearModuloCatalogo({ pool }) {
  // El orden de estos pasos es la fórmula del precio. Coincide con la que
  // usa el Excel del negocio: costo, más importación, más margen, más IVA.
  const motorDePrecios = new MotorDePrecios([
    new ImportacionPorAranceles(),
    new MargenDeGanancia(),
    new ImpuestoDeVenta(),
  ]);

  const repositorio = new CatalogoRepository({ pool });
  const servicio = new CatalogoService({ repositorio, motorDePrecios });
  const controlador = new CatalogoController({ servicio });

  return {
    rutas: crearRutasDeCatalogo(controlador),
    // Carrito y pedidos usan el mismo motor para no calcular el precio de
    // otra forma.
    motorDePrecios,
    // La importación del Excel guarda los productos por aquí, porque las
    // tablas de catálogo solo las escribe este módulo.
    guardarProductoPorSku: (cliente, producto) => repositorio.guardarPorSku(cliente, producto),
  };
}
