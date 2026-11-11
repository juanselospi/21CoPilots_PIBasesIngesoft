import test from "node:test";
import assert from "node:assert/strict";

import { FamiliasService } from "./familias.service.js";
import { EVENTOS } from "../../shared/eventos/eventos-de-dominio.js";
import {
  EntradaInvalida,
  RecursoNoEncontrado,
  ReglaDeNegocioViolada,
} from "../../shared/errores/errores-de-dominio.js";

const clave = (nombre) => nombre.trim().replace(/\s+/g, " ").toLowerCase();

// Base falsa: busca sin importar mayúsculas ni espacios, como el SQL.
// Legos tiene dos productos y Funkos ninguno.
function crearServicio() {
  const familias = new Map(
    [
      { nombre: "Legos", descripcion: null, porcentajeImportacion: 15, margenGanancia: 18, activa: true, totalDeProductos: 2 },
      { nombre: "Funkos", descripcion: null, porcentajeImportacion: 0, margenGanancia: 0, activa: true, totalDeProductos: 0 },
    ].map((familia) => [clave(familia.nombre), familia])
  );
  const eventos = [];

  const repositorio = {
    listarFamilias: async () => [...familias.values()],
    buscarFamilia: async (nombre) => {
      const familia = familias.get(clave(nombre));
      return familia ? { ...familia } : null;
    },
    crearFamilia: async (familia) => {
      familias.set(clave(familia.nombre), { ...familia, activa: true, totalDeProductos: 0 });
    },
    actualizarFamilia: async (nombre, cambios) => {
      const familia = { ...familias.get(clave(nombre)), ...cambios };
      familias.delete(clave(nombre));
      familias.set(clave(familia.nombre), familia);
    },
    eliminarFamilia: async (nombre) => familias.delete(clave(nombre)),
  };
  const busDeEventos = { publicar: async (evento, datos) => eventos.push({ evento, datos }) };

  return { servicio: new FamiliasService({ repositorio, busDeEventos }), familias, eventos };
}

test("crea una familia con importación y margen en 0 si no vienen", async () => {
  const { servicio } = crearServicio();

  const familia = await servicio.crear({ nombre: "Coleccionables" });

  assert.equal(familia.nombre, "Coleccionables");
  assert.equal(familia.porcentajeImportacion, 0);
  assert.equal(familia.margenGanancia, 0);
});

test("no crea una familia repetida aunque cambien mayúsculas o espacios", async () => {
  const { servicio, familias } = crearServicio();

  await assert.rejects(servicio.crear({ nombre: "  LEGOS " }), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.equal(error.message, "Ya existe la familia Legos.");
    return true;
  });
  assert.equal(familias.size, 2);
});

test("datos inválidos no crean nada", async () => {
  const { servicio, familias } = crearServicio();

  await assert.rejects(servicio.crear({ nombre: "" }), EntradaInvalida);
  assert.equal(familias.size, 2);
});

test("cambiar el margen publica el valor anterior y el nuevo para la bitácora", async () => {
  const { servicio, eventos } = crearServicio();

  const familia = await servicio.actualizar("legos", { margenGanancia: 25 }, { responsable: "admin@dchobbies.test" });

  assert.equal(familia.margenGanancia, 25);
  assert.deepEqual(eventos, [
    {
      evento: EVENTOS.PARAMETRO_MODIFICADO,
      datos: {
        correoUsuario: "admin@dchobbies.test",
        entidad: "familia",
        entidadId: "Legos",
        valorAnterior: { porcentajeImportacion: 15, margenGanancia: 18 },
        valorNuevo: { porcentajeImportacion: 15, margenGanancia: 25 },
      },
    },
  ]);
});

test("cambiar la descripción o desactivar no publica cambio de parámetros", async () => {
  const { servicio, eventos } = crearServicio();

  const familia = await servicio.actualizar("Legos", { descripcion: "Sets de LEGO", activa: false });

  assert.equal(familia.activa, false);
  assert.deepEqual(eventos, []);
});

test("renombra una familia", async () => {
  const { servicio, familias } = crearServicio();

  await servicio.actualizar("Legos", { nombre: "LEGO" });

  assert.ok(familias.has("lego"));
  assert.ok(!familias.has("legos"));
});

test("renombrar con solo otras mayúsculas se permite; con el nombre de otra familia no", async () => {
  const { servicio } = crearServicio();

  assert.equal((await servicio.actualizar("Legos", { nombre: "LEGOS" })).nombre, "LEGOS");
  await assert.rejects(servicio.actualizar("LEGOS", { nombre: "funkos" }), ReglaDeNegocioViolada);
});

test("editar o eliminar una familia que no existe responde no encontrado", async () => {
  const { servicio } = crearServicio();

  await assert.rejects(servicio.actualizar("Peluches", { margenGanancia: 10 }), RecursoNoEncontrado);
  await assert.rejects(servicio.eliminar("Peluches"), RecursoNoEncontrado);
});

test("elimina una familia sin productos", async () => {
  const { servicio, familias } = crearServicio();

  await servicio.eliminar("funkos");

  assert.ok(!familias.has("funkos"));
});

test("no elimina una familia con productos y dice cuántos tiene", async () => {
  const { servicio, familias } = crearServicio();

  await assert.rejects(servicio.eliminar("Legos"), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.match(error.message, /tiene 2 productos/);
    return true;
  });
  assert.ok(familias.has("legos"));
});

test("no elimina una familia que solo tiene productos eliminados con historial", async () => {
  const { servicio, familias } = crearServicio();
  const repositorio = {
    buscarFamilia: async () => ({ nombre: "Funkos", totalDeProductos: 0 }),
    eliminarFamilia: async () => "con_productos_eliminados",
  };
  const conEliminados = new FamiliasService({ repositorio });

  await assert.rejects(conEliminados.eliminar("Funkos"), (error) => {
    assert.ok(error instanceof ReglaDeNegocioViolada);
    assert.match(error.message, /productos eliminados que conservan su historial/);
    return true;
  });
  assert.ok(familias.has("funkos"));
});
