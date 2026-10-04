/**
 * Rutas del catálogo. Las de consulta son públicas, porque el visitante
 * navega el catálogo sin iniciar sesión (RF-10, RF-11, RF-12). Las que
 * cambian productos son solo para el administrador, igual que el listado
 * del panel, que muestra costos y márgenes.
 *
 *   GET /admin/productos              solo administrador (RF-43)
 *
 *     Todos los productos, también los ocultos en la tienda, con costo,
 *     margen, existencias, desglose del precio y etiquetas. Parámetros,
 *     todos opcionales:
 *
 *       q                 busca en el nombre o en el SKU
 *       categoria         igualdad exacta
 *       proveedor         igualdad exacta
 *       disponibilidad    en_existencia | por_contrapedido | no_disponible
 *       existenciasBajas  true | false; false es lo mismo que no mandarlo
 *       margenNegativo    true | false; false es lo mismo que no mandarlo
 *       precioMin         sobre el precio final, inclusive
 *       precioMax         sobre el precio final, inclusive
 *       orden             nombre (por defecto) | -nombre | precio | -precio
 *                         | existencias | sku; los empates van por SKU
 *       limite            24 (por defecto) | 48 | 96
 *       pagina            desde 0
 *
 *     200  { datos: [producto], meta: { total, pagina, limite } }
 *          `total` cuenta los productos que cumplen los filtros, antes
 *          de paginar
 *     400  un parámetro inválido; `detalles.campos` dice cuáles
 *     401  sin sesión
 *     403  con sesión de otro rol
 *
 *   PATCH /productos/:sku             solo administrador (RF-01, RN-02, RN-03)
 *
 *     Cambia el precio, las existencias o el contrapedido de un producto,
 *     también de uno oculto en la tienda. El SKU de la URL se normaliza
 *     (mayúsculas, sin espacios). Cuerpo JSON con cualquiera de estos
 *     campos; lo que no venga se queda como está:
 *
 *       costoItem              dólares, 0 o más
 *       porcentajeImportacion  0 o más
 *       margenGanancia         mayor que -100
 *       existencias            entero, 0 o más
 *       admiteContrapedido     true | false
 *
 *     Los números se aceptan como número o como texto ("12.5"). Un campo
 *     que viene vacío (null o "") es un error: para no cambiarlo, no se
 *     manda. Cualquier otra clave, incluidos los precios derivados, se
 *     rechaza.
 *
 *     200  { datos: producto } con el precio recalculado. Los campos
 *          derivados del modal "Editar producto" están en:
 *            Costo total          paso `importacion` de `desglosePrecio`
 *            Precio sin impuesto  paso `margen` de `desglosePrecio`
 *            Precio final         `precioFinal`
 *     400  cuerpo vacío, sin ninguno de los campos, con un valor
 *          inválido o con claves no permitidas; `detalles.campos` dice
 *          cuáles
 *     401  sin sesión
 *     403  con sesión de otro rol
 *     404  el SKU no existe
 */

import { Router } from "express";
import { asincrono } from "../../shared/http/envoltura-async.js";
import { exigirSesion } from "../../shared/http/autenticacion.js";
import { ROLES } from "../../shared/http/autorizacion-por-rol.js";

export function crearRutasDeCatalogo(controlador, { exigirRol }) {
  const rutas = Router();
  const soloAdministrador = [exigirSesion, exigirRol(ROLES.ADMINISTRADOR)];

  rutas.get("/productos", asincrono(controlador.listar));
  rutas.get("/productos/:sku", asincrono(controlador.obtenerFicha));
  rutas.get("/categorias", asincrono(controlador.listarCategorias));

  rutas.get("/admin/productos", ...soloAdministrador, asincrono(controlador.listarParaAdministracion));
  rutas.post("/productos", ...soloAdministrador, asincrono(controlador.crear));
  rutas.patch("/productos/:sku", ...soloAdministrador, asincrono(controlador.actualizar));

  return rutas;
}
