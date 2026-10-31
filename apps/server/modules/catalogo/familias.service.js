/**
 * CAPA DE DOMINIO — Familias de productos (solo administrador).
 *
 * La familia define la importación y el margen que heredan sus productos.
 * Cambiar esos valores cambia el precio de todos los que heredan, por eso
 * cada cambio se publica para la bitácora (RF-52).
 */

import { RecursoNoEncontrado, ReglaDeNegocioViolada } from "../../shared/errores/errores-de-dominio.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import { validarFamiliaNueva, validarCambiosDeFamilia } from "./validar-familia.js";

const BUS_SIN_SUSCRIPTORES = { publicar: async () => {} };

export class FamiliasService {
  #repositorio;
  #busDeEventos;

  constructor({ repositorio, busDeEventos = BUS_SIN_SUSCRIPTORES }) {
    this.#repositorio = repositorio;
    this.#busDeEventos = busDeEventos;
  }

  /** Todas, también las inactivas, con cuántos productos tiene cada una. */
  async listarParaAdministracion() {
    return this.#repositorio.listarFamilias();
  }

  async crear(datos) {
    const familia = validarFamiliaNueva(datos);
    await this.#exigirNombreLibre(familia.nombre);

    await this.#repositorio.crearFamilia(familia);
    return this.#repositorio.buscarFamilia(familia.nombre);
  }

  async actualizar(nombre, datos, { responsable = null } = {}) {
    const cambios = validarCambiosDeFamilia(datos);
    const actual = await this.#obtener(nombre);

    if (cambios.nombre !== undefined) await this.#exigirNombreLibre(cambios.nombre, actual);

    await this.#repositorio.actualizarFamilia(actual.nombre, cambios);
    const actualizada = await this.#repositorio.buscarFamilia(cambios.nombre ?? actual.nombre);

    if (cambioElPrecio(actual, actualizada)) {
      await this.#busDeEventos.publicar(EVENTOS.PARAMETRO_MODIFICADO, {
        correoUsuario: responsable,
        entidad: "familia",
        entidadId: actualizada.nombre,
        valorAnterior: valoresDePrecio(actual),
        valorNuevo: valoresDePrecio(actualizada),
      });
    }

    return actualizada;
  }

  // Si tiene productos no se borra: hay que moverlos o desactivar la familia
  async eliminar(nombre) {
    const familia = await this.#obtener(nombre);

    if (familia.totalDeProductos > 0) {
      const productos = familia.totalDeProductos === 1 ? "1 producto" : `${familia.totalDeProductos} productos`;
      throw new ReglaDeNegocioViolada(
        `La familia ${familia.nombre} tiene ${productos}. Muévalos a otra familia o desactívela en su lugar.`,
        "FAMILIA_CON_PRODUCTOS"
      );
    }

    await this.#repositorio.eliminarFamilia(familia.nombre);
  }

  async #obtener(nombre) {
    const familia = await this.#repositorio.buscarFamilia(nombre);
    if (!familia) throw new RecursoNoEncontrado("la familia", nombre);
    return familia;
  }

  // Renombrar "Legos" a "LEGOS" es la misma familia y se permite
  async #exigirNombreLibre(nombre, actual = null) {
    const existente = await this.#repositorio.buscarFamilia(nombre);
    if (existente && existente.nombre !== actual?.nombre) {
      throw new ReglaDeNegocioViolada(`Ya existe la familia ${existente.nombre}.`, "FAMILIA_REPETIDA");
    }
  }
}

const valoresDePrecio = ({ porcentajeImportacion, margenGanancia }) => ({ porcentajeImportacion, margenGanancia });

const cambioElPrecio = (antes, despues) =>
  antes.porcentajeImportacion !== despues.porcentajeImportacion || antes.margenGanancia !== despues.margenGanancia;
