/**
 * CAPA DE API: Controlador del catálogo.
 *
 * Traduce HTTP a llamadas de dominio y de vuelta. No calcula precios, no
 * consulta la base y no decide reglas: si este archivo crece con `if` de
 * negocio, la lógica está en la capa equivocada.
 */

import {
  aProductoPublico,
  aProductoAdministrativo,
  aFamiliaPublica,
  aFamiliaAdministrativa,
} from "./catalogo.dto.js";
import { validarConsultaAdministrativa } from "./validar-consulta-administrativa.js";
import { validarConsultaPublica } from "./validar-consulta-publica.js";

export class CatalogoController {
  #servicio;
  #familias;

  constructor({ servicio, familias }) {
    this.#servicio = servicio;
    this.#familias = familias;
  }

  // GET /productos, público. `meta` trae el total para paginar; quien solo lee `datos` sigue igual
  listar = async (peticion, respuesta) => {
    const { pagina, ...filtros } = validarConsultaPublica(peticion.query);

    const { productos, total } = await this.#servicio.listarCatalogo({
      ...filtros,
      desplazamiento: pagina * filtros.limite,
    });

    respuesta.json({
      datos: productos.map(aProductoPublico),
      meta: { total, pagina, limite: filtros.limite },
    });
  };

  obtenerFicha = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    const producto = await this.#servicio.obtenerFicha(sku);
    respuesta.json({ datos: aProductoPublico(producto) });
  };

  listarFamilias = async (_peticion, respuesta) => {
    const familias = await this.#servicio.listarFamilias();
    respuesta.json({ datos: familias.map(aFamiliaPublica) });
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
    const producto = await this.#servicio.actualizarProducto(sku, peticion.body, {
      responsable: peticion.usuario.correo,
    });
    respuesta.json({ datos: aProductoAdministrativo(producto) });
  };

  // PATCH /productos/:sku/estado, solo administrador
  cambiarEstado = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    const producto = await this.#servicio.cambiarEstado(sku, peticion.body, { responsable: peticion.usuario.correo });
    respuesta.json({ datos: aProductoAdministrativo(producto) });
  };

  // DELETE /productos/:sku, solo administrador. 204 sin cuerpo
  eliminar = async (peticion, respuesta) => {
    const sku = peticion.params.sku.trim().toUpperCase();
    await this.#servicio.eliminarProducto(sku, { responsable: peticion.usuario.correo });
    respuesta.status(204).end();
  };

  // GET /admin/familias, solo administrador
  listarFamiliasParaAdministracion = async (_peticion, respuesta) => {
    const familias = await this.#familias.listarParaAdministracion();
    respuesta.json({ datos: familias.map(aFamiliaAdministrativa) });
  };

  // POST /familias, solo administrador
  crearFamilia = async (peticion, respuesta) => {
    const familia = await this.#familias.crear(peticion.body ?? {});
    respuesta.status(201).json({ datos: aFamiliaAdministrativa(familia) });
  };

  // PATCH /familias/:nombre, solo administrador
  actualizarFamilia = async (peticion, respuesta) => {
    const familia = await this.#familias.actualizar(peticion.params.nombre, peticion.body, {
      responsable: peticion.usuario.correo,
    });
    respuesta.json({ datos: aFamiliaAdministrativa(familia) });
  };

  // DELETE /familias/:nombre, solo administrador
  eliminarFamilia = async (peticion, respuesta) => {
    await this.#familias.eliminar(peticion.params.nombre);
    respuesta.status(204).end();
  };
}
