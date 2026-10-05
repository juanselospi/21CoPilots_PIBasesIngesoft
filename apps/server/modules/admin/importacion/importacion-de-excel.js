/**
 * Importación del Excel de productos.
 */

import ExcelJS from "exceljs";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";
import { PlantillaDeImportacion } from "./plantilla-de-importacion.js";
import { COLUMNAS, TIPOS, normalizarEncabezado } from "./columnas.js";

// por si el encabezado no esta de primero
const FILAS_DONDE_BUSCAR_ENCABEZADO = 10;

// valida tamaños de las columnas de catalogo.producto.
const LIMITES = Object.freeze({
  sku: 50,
  nombre: 200,
  categoria: 100,
  imagenUrl: 500,
  costo: 9_999_999_999.99,     // NUMERIC(12,2)
  porcentaje: 9_999.99,        // NUMERIC(6,2)
});

export class ImportacionDeExcel extends PlantillaDeImportacion {
  #guardarProducto;
  #enTransaccion;
  #porcentajeIva;

  /**
   * @param {object} dependencias
   * @param {(cliente, producto: object) => Promise<{sku: string, insertado: boolean}>} dependencias.guardarProducto
   *        inserta o actualiza el producto por SKU
   * @param {(trabajo: (cliente) => Promise<any>) => Promise<any>} dependencias.enTransaccion
   * @param {number} dependencias.impuestoDeVenta como proporción: 0.13
   */
  constructor({ guardarProducto, enTransaccion, impuestoDeVenta }) {
    super();
    this.#guardarProducto = guardarProducto;
    this.#enTransaccion = enTransaccion;
    this.#porcentajeIva = redondear(impuestoDeVenta * 100);
  }

  async parsear(archivo) {
    const libro = new ExcelJS.Workbook();
    try {
      await libro.xlsx.load(archivo);
    } catch {
      throw new EntradaInvalida("El archivo no es un Excel (.xlsx) válido.", ["archivo"]);
    }

    const { hoja, numeroDeEncabezado, columnaPorCampo } = ubicarEncabezado(libro);
    const filas = [];

    hoja.eachRow((fila, numero) => {
      if (numero <= numeroDeEncabezado) return;

      const datos = { linea: numero };
      for (const [campo, { columna, tipo }] of columnaPorCampo) {
        // columna null = columna opcional que no viene en el archivo
        datos[campo] = columna === null ? null : leerCelda(fila.getCell(columna), tipo);
      }

      const estaVacia = [...columnaPorCampo.keys()].every((campo) => datos[campo] === null);
      if (!estaVacia) filas.push(datos);
    });

    return filas;
  }

  /** En qué filas aparece cada SKU, para encontrar los repetidos. */
  prepararContexto(filas) {
    const lineasPorSku = new Map();
    for (const fila of filas) {
      const sku = normalizarSku(fila.codigoSku);
      if (!sku) continue;
      lineasPorSku.set(sku, [...(lineasPorSku.get(sku) ?? []), fila.linea]);
    }
    return { lineasPorSku };
  }

  validarFila(fila, { lineasPorSku }) {
    const motivos = [];

    const sku = normalizarSku(fila.codigoSku);
    if (!sku) {
      motivos.push("Falta el codigo_sku.");
    } else {
      if (sku.length > LIMITES.sku) {
        motivos.push(`El codigo_sku supera los ${LIMITES.sku} caracteres.`);
      }
      const lineas = lineasPorSku.get(sku);
      if (lineas.length > 1) {
        motivos.push(`El codigo_sku ${sku} se repite en las filas ${lineas.join(", ")}.`);
      }
    }

    exigirTexto(motivos, fila.familia, "familia", LIMITES.categoria);
    exigirTexto(motivos, fila.nombre, "descripcion_corta", LIMITES.nombre);

    exigirNumero(motivos, fila.costo, "costo_usd", { minimo: 0, maximo: LIMITES.costo });
    exigirNumero(motivos, fila.porcentajeImportacion, "%_costo_importacion", {
      minimo: 0,
      maximo: LIMITES.porcentaje,
    });
    // El margen puede ser negativo (liquidaciones), pero con -100 % el
    // precio quedaría en cero.
    exigirNumero(motivos, fila.margenGanancia, "%_margen_ganancia", {
      mayorQue: -100,
      maximo: LIMITES.porcentaje,
    });

    if (fila.porcentajeIva !== null && fila.porcentajeIva !== this.#porcentajeIva) {
      motivos.push(
        `El %_IVA es ${fila.porcentajeIva} % y el sistema usa ${this.#porcentajeIva} %.`
      );
    }

    if (fila.imagenUrl !== null) {
      if (!esUrlWeb(fila.imagenUrl)) {
        motivos.push("La url_imagen no es una dirección web válida (http o https).");
      } else if (fila.imagenUrl.length > LIMITES.imagenUrl) {
        motivos.push(`La url_imagen supera los ${LIMITES.imagenUrl} caracteres.`);
      }
    }

    return motivos;
  }

  // La tasa siempre es la del sistema porque validarFila rechaza otro %_IVA.
  mapearFila(fila) {
    return {
      sku: normalizarSku(fila.codigoSku),
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      categoria: fila.familia,
      imagenUrl: fila.imagenUrl,
      costoItem: fila.costo,
      porcentajeImportacion: fila.porcentajeImportacion,
      margenGanancia: fila.margenGanancia,
      tasaImpuesto: this.#porcentajeIva,
    };
  }

  async enTransaccion(trabajo) {
    return this.#enTransaccion(trabajo);
  }

  async guardarFila(cliente, producto) {
    return this.#guardarProducto(cliente, producto);
  }
}

/**
 * Busca en cada hoja la fila con más encabezados conocidos
 */
function ubicarEncabezado(libro) {
  const porEncabezado = new Map(COLUMNAS.map((c) => [normalizarEncabezado(c.encabezado), c]));

  for (const hoja of libro.worksheets) {
    let mejor = null;

    const ultima = Math.min(hoja.rowCount, FILAS_DONDE_BUSCAR_ENCABEZADO);
    for (let numero = 1; numero <= ultima; numero += 1) {
      const encontradas = new Map();
      hoja.getRow(numero).eachCell((celda, columna) => {
        const definicion = porEncabezado.get(normalizarEncabezado(valorCrudo(celda)));
        if (definicion) encontradas.set(definicion.encabezado, { definicion, columna });
      });

      if (encontradas.size >= 2 && encontradas.size > (mejor?.encontradas.size ?? 0)) {
        mejor = { numero, encontradas };
      }
    }

    if (mejor) return construirMapa(hoja, mejor);
  }

  throw new EntradaInvalida(
    "No se encontró la fila de encabezados de productos. Use la plantilla oficial.",
    ["archivo"]
  );
}

function construirMapa(hoja, { numero, encontradas }) {
  const faltantes = COLUMNAS
    .filter((c) => c.obligatoria && !encontradas.has(c.encabezado))
    .map((c) => c.encabezado);

  if (faltantes.length > 0) {
    throw new EntradaInvalida(
      `Al archivo le faltan columnas obligatorias: ${faltantes.join(", ")}.`,
      faltantes
    );
  }

  const columnaPorCampo = new Map();
  for (const { definicion, columna } of encontradas.values()) {
    if (definicion.campo) {
      columnaPorCampo.set(definicion.campo, { columna, tipo: definicion.tipo });
    }
  }
  for (const { campo, tipo } of COLUMNAS) {
    if (campo && !columnaPorCampo.has(campo)) columnaPorCampo.set(campo, { columna: null, tipo });
  }

  return { hoja, numeroDeEncabezado: numero, columnaPorCampo };
}

/**
 * exceljs devuelve objetos para fórmulas, links y texto con formato.
 */
function valorCrudo(celda) {
  const valor = celda.value;
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "object" || valor instanceof Date) return valor;

  if ("formula" in valor || "sharedFormula" in valor) return valor.result ?? null;
  if ("hyperlink" in valor) return valor.hyperlink;
  if ("richText" in valor) return valor.richText.map((parte) => parte.text).join("");
  if ("error" in valor) return valor.error; // #DIV/0!, #REF!, etc. El validador lo rechaza
  return null;
}

// Si un número no se puede convertir se deja como NaN en vez de null
function leerCelda(celda, tipo) {
  const valor = valorCrudo(celda);

  if (valor === null) return null;
  if (typeof valor === "string" && valor.trim() === "") return null;

  switch (tipo) {
    case TIPOS.MONTO:
      return aNumero(valor);
    case TIPOS.PORCENTAJE:
      return aPorcentaje(valor, celda.numFmt);
    default:
      return String(valor).trim();
  }
}

// Acepta montos escritos como texto
function aNumero(valor) {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;

  const limpio = valor.replace(/[$\s,]/g, "");
  return limpio === "" ? NaN : Number(limpio);
}

// Excel guarda 20 % como 0.2 (con formato de porcentaje), hay que pasarlo a 20
function aPorcentaje(valor, formato = "") {
  if (typeof valor === "number") {
    return formato.includes("%") ? redondear(valor * 100) : valor;
  }
  if (typeof valor === "string") {
    return aNumero(valor.replace("%", ""));
  }
  return NaN;
}

const normalizarSku = (codigo) => (codigo ? String(codigo).trim().toUpperCase() : "");

function exigirTexto(motivos, valor, columna, maximo) {
  if (!valor) motivos.push(`Falta ${columna}.`);
  else if (valor.length > maximo) motivos.push(`${columna} supera los ${maximo} caracteres.`);
}

function exigirNumero(motivos, valor, columna, { minimo, mayorQue, maximo }) {
  if (valor === null) {
    motivos.push(`Falta ${columna}.`);
  } else if (!Number.isFinite(valor)) {
    motivos.push(`${columna} no es un número.`);
  } else if (minimo !== undefined && valor < minimo) {
    motivos.push(`${columna} no puede ser menor que ${minimo}.`);
  } else if (mayorQue !== undefined && valor <= mayorQue) {
    motivos.push(`${columna} debe ser mayor que ${mayorQue}.`);
  } else if (valor > maximo) {
    motivos.push(`${columna} no puede ser mayor que ${maximo}.`);
  }
}

function esUrlWeb(texto) {
  try {
    const { protocol } = new URL(texto);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// asegurar el numero tenga 4 decimales, por si acaso
const redondear = (numero) => Math.round(numero * 10_000) / 10_000;
