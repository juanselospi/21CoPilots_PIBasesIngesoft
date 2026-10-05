/**
 * Arma el módulo de catálogo.
 */

import { CatalogoRepository } from "./catalogo.repository.js";
import { CatalogoService } from "./catalogo.service.js";
import { CatalogoController } from "./catalogo.controller.js";
import { crearRutasDeCatalogo } from "./catalogo.routes.js";
import { MotorDePrecios } from "./precio/motor-de-precios.js";
import { ImportacionPorAranceles } from "./precio/pasos/importacion-por-aranceles.js";
import { MargenDeGanancia } from "./precio/pasos/margen-de-ganancia.js";
import { ImpuestoDeVenta } from "./precio/pasos/impuesto-de-venta.js";

export function crearModuloCatalogo({ pool, exigirRol, umbralDeExistenciasBajas }) {
  // El orden de estos pasos es la fórmula del precio
  const motorDePrecios = new MotorDePrecios([
    new ImportacionPorAranceles(),
    new MargenDeGanancia(),
    new ImpuestoDeVenta(),
  ]);

  const repositorio = new CatalogoRepository({ pool });
  const servicio = new CatalogoService({ repositorio, motorDePrecios, umbralDeExistenciasBajas });
  const controlador = new CatalogoController({ servicio });

  return {
    rutas: crearRutasDeCatalogo(controlador, { exigirRol }),
    // Carrito y pedidos usan el mismo motor para no calcular el precio de
    // otra forma.
    motorDePrecios,
    // La importación del Excel guarda los productos por aquí, porque las
    // tablas de catálogo solo las escribe este módulo.
    guardarProductoPorSku: (cliente, producto) => repositorio.guardarPorSku(cliente, producto),
  };
}
