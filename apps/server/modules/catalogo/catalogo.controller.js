/**
 * CAPA DE API — Controlador del catálogo.
 *
 * Traduce HTTP a llamadas de dominio y de vuelta. No calcula precios, no
 * consulta la base y no decide reglas: si este archivo crece con `if` de
 * negocio, la lógica está en la capa equivocada.
 */

import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";
import { aProductoPublico, aCategoriaPublica } from "./catalogo.dto.js";

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
      categoriaId: leerEntero(categoria, "categoria", { minimo: 1 }),
      termino: q?.trim() || null,
      limite: porPagina,
      desplazamiento: (leerEntero(pagina, "pagina", { minimo: 0 }) ?? 0) * porPagina,
    });

    respuesta.json({ datos: productos.map(aProductoPublico) });
  };

  obtenerFicha = async (peticion, respuesta) => {
    const id = leerEntero(peticion.params.id, "id", { minimo: 1 });
    const producto = await this.#servicio.obtenerFicha(id);
    respuesta.json({ datos: aProductoPublico(producto) });
  };

  listarCategorias = async (_peticion, respuesta) => {
    const categorias = await this.#servicio.listarCategorias();
    respuesta.json({ datos: categorias.map(aCategoriaPublica) });
  };
}

/** Lee un entero opcional de la petición; `null` si no viene. */
function leerEntero(valor, campo, { minimo, maximo = Number.MAX_SAFE_INTEGER }) {
  if (valor === undefined || valor === "") return null;

  const entero = Number(valor);
  if (!Number.isInteger(entero) || entero < minimo || entero > maximo) {
    throw new EntradaInvalida(`"${campo}" debe ser un entero válido.`, [campo]);
  }
  return entero;
}
