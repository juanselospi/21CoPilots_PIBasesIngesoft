import test from "node:test";
import assert from "node:assert/strict";

import { validarConsultaDeBitacora } from "./validar-consulta-de-bitacora.js";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

test("sin filtros devuelve la primera página de 50", () => {
  const filtros = validarConsultaDeBitacora({});

  assert.equal(filtros.limite, 50);
  assert.equal(filtros.pagina, 0);
  assert.equal(filtros.desde, null);
});

test("'hasta' incluye todo ese día", () => {
  const { desde, hasta } = validarConsultaDeBitacora({ desde: "2026-11-01", hasta: "2026-11-03" });

  assert.equal((hasta - desde) / (24 * 60 * 60 * 1000), 3);
});

test("pasa los filtros de entidad, evento y usuario", () => {
  const filtros = validarConsultaDeBitacora({
    entidad: "familia",
    entidadId: "Legos",
    evento: "parametro_modificado",
    correo: "Admin@DCHobbies.test",
  });

  assert.equal(filtros.entidadId, "Legos");
  assert.equal(filtros.correoUsuario, "admin@dchobbies.test");
});

test("informa todos los parámetros malos a la vez", () => {
  assert.throws(
    () => validarConsultaDeBitacora({ desde: "ayer", limite: "10", pagina: "-1" }),
    (error) => {
      assert.ok(error instanceof EntradaInvalida);
      assert.deepEqual(error.detalles.campos, ["desde", "limite", "pagina"]);
      return true;
    }
  );
});

test("'desde' después de 'hasta' se rechaza", () => {
  assert.throws(() => validarConsultaDeBitacora({ desde: "2026-11-05", hasta: "2026-11-01" }), EntradaInvalida);
});
