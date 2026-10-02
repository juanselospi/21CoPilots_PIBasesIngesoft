import test from "node:test";
import assert from "node:assert/strict";

import { validarConsultaAdministrativa } from "./validar-consulta-administrativa.js";
import { EntradaInvalida } from "../../shared/errores/errores-de-dominio.js";

/** Parámetros marcados como malos, o [] si la consulta pasa. */
function camposConProblemas(consulta) {
  try {
    validarConsultaAdministrativa(consulta);
    return [];
  } catch (error) {
    assert.ok(error instanceof EntradaInvalida);
    return error.detalles.campos;
  }
}

test("sin parámetros no filtra nada y usa los valores por defecto", () => {
  assert.deepEqual(validarConsultaAdministrativa({}), {
    termino: null,
    categoria: null,
    proveedor: null,
    disponibilidad: null,
    existenciasBajas: false,
    margenNegativo: false,
    precioMin: null,
    precioMax: null,
    orden: "nombre",
    limite: 24,
    pagina: 0,
  });
});

test("normaliza una consulta completa", () => {
  const filtros = validarConsultaAdministrativa({
    q: "  pkm ",
    categoria: "Juguetes",
    proveedor: "Games Import",
    disponibilidad: "por_contrapedido",
    existenciasBajas: "true",
    margenNegativo: "false",
    precioMin: "5000",
    precioMax: "9000.50",
    orden: "-precio",
    limite: "96",
    pagina: "3",
  });

  assert.deepEqual(filtros, {
    termino: "pkm",
    categoria: "Juguetes",
    proveedor: "Games Import",
    disponibilidad: "por_contrapedido",
    existenciasBajas: true,
    margenNegativo: false,
    precioMin: 5000,
    precioMax: 9000.5,
    orden: "-precio",
    limite: 96,
    pagina: 3,
  });
});

test("un parámetro vacío cuenta como que no vino", () => {
  const filtros = validarConsultaAdministrativa({ q: " ", orden: "", limite: "", existenciasBajas: "", precioMin: "" });

  assert.equal(filtros.termino, null);
  assert.equal(filtros.orden, "nombre");
  assert.equal(filtros.limite, 24);
  assert.equal(filtros.existenciasBajas, false);
  assert.equal(filtros.precioMin, null);
});

test("acepta los seis valores de 'orden' y rechaza cualquier otro", () => {
  for (const orden of ["nombre", "-nombre", "precio", "-precio", "existencias", "sku"]) {
    assert.equal(validarConsultaAdministrativa({ orden }).orden, orden);
  }
  for (const orden of ["name-asc", "-sku", "fecha", "toString"]) {
    assert.deepEqual(camposConProblemas({ orden }), ["orden"]);
  }
});

test("rechaza una disponibilidad desconocida", () => {
  assert.deepEqual(camposConProblemas({ disponibilidad: "descontinuado" }), ["disponibilidad"]);
});

test("'limite' solo puede ser 24, 48 o 96", () => {
  for (const limite of ["24", "48", "96"]) {
    assert.equal(validarConsultaAdministrativa({ limite }).limite, Number(limite));
  }
  for (const limite of ["0", "10", "97", "24.0", "abc"]) {
    assert.deepEqual(camposConProblemas({ limite }), ["limite"]);
  }
});

test("'pagina' tiene que ser un entero de 0 o más", () => {
  assert.equal(validarConsultaAdministrativa({ pagina: "0" }).pagina, 0);
  for (const pagina of ["-1", "1.5", "abc", "99999999999999999999"]) {
    assert.deepEqual(camposConProblemas({ pagina }), ["pagina"]);
  }
});

test("los booleanos solo aceptan true o false", () => {
  for (const valor of ["1", "si", "TRUE"]) {
    assert.deepEqual(camposConProblemas({ existenciasBajas: valor }), ["existenciasBajas"]);
    assert.deepEqual(camposConProblemas({ margenNegativo: valor }), ["margenNegativo"]);
  }
});

test("los precios tienen que ser números de 0 o más", () => {
  assert.equal(validarConsultaAdministrativa({ precioMin: "0" }).precioMin, 0);
  for (const precio of ["-1", "abc", "1e3", "Infinity"]) {
    assert.deepEqual(camposConProblemas({ precioMin: precio }), ["precioMin"]);
    assert.deepEqual(camposConProblemas({ precioMax: precio }), ["precioMax"]);
  }
});

test("'precioMin' no puede ser mayor que 'precioMax', pero sí igual", () => {
  assert.deepEqual(camposConProblemas({ precioMin: "9000", precioMax: "5000" }), ["precioMin", "precioMax"]);
  assert.deepEqual(camposConProblemas({ precioMin: "5000", precioMax: "5000" }), []);
});

test("un parámetro repetido se rechaza", () => {
  assert.deepEqual(camposConProblemas({ q: ["pkm", "mtg"] }), ["q"]);
});

test("junta todos los problemas en un solo error", () => {
  assert.throws(
    () => validarConsultaAdministrativa({ orden: "fecha", limite: "10", pagina: "-1" }),
    (error) => {
      assert.ok(error instanceof EntradaInvalida);
      assert.deepEqual(error.detalles.campos, ["orden", "limite", "pagina"]);
      return true;
    }
  );
});
