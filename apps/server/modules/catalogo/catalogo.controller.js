/**
 * CAPA DE API — Controlador del catálogo.
 *
 * Traduce HTTP a llamadas de dominio y de vuelta. No calcula precios, no
 * consulta la base y no decide reglas: si este archivo crece con `if` de
 * negocio, la lógica está en la capa equivocada.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { aProductoPublico, aProductoAdministrativo, aCategoriaPublica } from "./catalogo.dto.js";
import { validarConsultaAdministrativa } from "./validar-consulta-administrativa.js";

const LIMITE_POR_DEFECTO = 24;
const LIMITE_MAXIMO = 48;

export class CatalogoController {
  #servicio;

  constructor({ servicio }) {
    this.#servicio = servicio;
  }

  listar = async (peticion, respuesta) => {
    const { categoria, q, limite, pagina } = peticion.query;
    const porPagina = leerEntero(limite, "limite", { minimo: 1, maximo: LIMITE_MAXIMO }) ?? LIMITE_POR_DEFECTO;

    const productos = await this.#servicio.listarCatalogo({
      categoria: categoria?.trim() || null,
      termino: q?.trim() || null,
      limite: porPagina,
      desplazamiento: (leerEntero(pagina, "pagina", { minimo: 0 }) ?? 0) * porPagina,
    });

    respuesta.json({ datos: productos.map(aProductoPublico) });
  };

  obtenerFicha = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    const producto = await this.#servicio.obtenerFicha(sku);
    respuesta.json({ datos: aProductoPublico(producto) });
  };

  listarCategorias = async (_peticion, respuesta) => {
    const categorias = await this.#servicio.listarCategorias();
    respuesta.json({ datos: categorias.map(aCategoriaPublica) });
  };

  // GET /admin/productos, solo administrador
  listarParaAdministracion = async (peticion, respuesta) => {
    const { pagina, ...filtros } = validarConsultaAdministrativa(peticion.query);

    const { productos, total } = await this.#servicio.listarParaAdministracion({
      ...filtros,
      desplazamiento: pagina * filtros.limite,
    });

    respuesta.json({
      datos: productos.map(aProductoAdministrativo),
      meta: { total, pagina, limite: filtros.limite },
    });
  };

  // POST /productos, solo administrador. Responde 201 con el producto, su
  // costo y el desglose del precio, para que el panel no lo pida otra vez.
  crear = async (peticion, respuesta) => {
    const producto = await this.#servicio.crearProducto(peticion.body ?? {});
    respuesta.status(201).json({ datos: aProductoAdministrativo(producto) });
  };

  // PATCH /productos/:sku, solo administrador
  actualizar = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    const producto = await this.#servicio.actualizarProducto(sku, peticion.body);
    respuesta.json({ datos: aProductoAdministrativo(producto) });
  };
}

// Lee un entero opcional de la peticion y null si no viene
function leerEntero(valor, campo, { minimo, maximo = Number.MAX_SAFE_INTEGER }) {
  if (valor === undefined || valor === "") return null;

  const entero = Number(valor);
  if (!Number.isInteger(entero) || entero < minimo || entero > maximo) {
    throw new EntradaInvalida(`"${campo}" debe ser un entero válido.`, [campo]);
  }
  return entero;
}
