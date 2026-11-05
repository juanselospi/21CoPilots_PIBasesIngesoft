// Genera las semillas SQL privadas del cliente a partir de su Excel.
//
//   npm run db:generar-semillas-cliente                        usa el .xlsx de datos-cliente/
//   npm run db:generar-semillas-cliente -- ruta/al/excel.xlsx
//
// No necesita PostgreSQL ni el servidor: lee y valida el Excel con el mismo
// importador del botón «Cargar Excel» (apps/server/modules/admin/importacion/),
// pero en vez de guardar en la base, junta las filas válidas y escribe:
//
//   datos-cliente/semillas/01_familias.sql    familias de la hoja que no existan
//   datos-cliente/semillas/02_productos.sql   productos por SKU (como guardarPorSku)
//   datos-cliente/semillas/03_inventario.sql  existencias iniciales de prueba
//
// Los .sql llevan costos y márgenes reales: quedan dentro de datos-cliente/,
// que está en .gitignore. Se cargan con db:seed:cliente o db:cliente.
//
// Es ESM porque el importador del servidor es ESM. exceljs se resuelve desde
// apps/server/node_modules, así que database/ no suma dependencias.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { CLIENT_DIR, CLIENT_SEEDS_DIR, SEED_ADMIN_EMAIL } = require('./lib.js');

// Existencias iniciales de prueba (no son las reales del cliente)
const EXISTENCIAS_NORMALES = { minimo: 10, maximo: 30 };
const EXISTENCIAS_BAJAS = { minimo: 0, maximo: 2 };
const MOTIVO_EXISTENCIAS_INICIALES = 'Existencias iniciales de prueba de la carga del cliente';

// Misma comparación de nombres de familia que catalogo.repository.js
const nombreComparable = (expresion) => `lower(regexp_replace(btrim(${expresion}), '\\s+', ' ', 'g'))`;

async function main() {
  const archivo = buscarExcel(process.argv[2]);
  if (!archivo) return;

  let modulos;
  try {
    modulos = await cargarImportadorDelServidor();
  } catch (err) {
    console.error(
      `✖ No se pudo cargar el importador de apps/server (${err.code ?? err.message}).\n` +
        '  ¿Instaló las dependencias del servidor?  ->  npm --prefix apps/server install'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`→ Leyendo ${path.basename(archivo)} ...`);
  let lectura;
  try {
    lectura = await leerExcel(fs.readFileSync(archivo), modulos);
  } catch (err) {
    // EntradaInvalida: no es .xlsx o le faltan columnas obligatorias
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const { resumen, productos } = lectura;
  console.log(`✔ Filas leídas: ${resumen.leidas}, válidas: ${productos.length}, rechazadas: ${resumen.rechazadas.length}.`);
  // Solo línea, SKU y motivo: nunca costos ni márgenes en la consola
  for (const { linea, fila, motivos } of resumen.rechazadas) {
    console.log(`  · Fila ${linea} (${fila.codigoSku ?? 'sin código'}): ${motivos.join('; ')}`);
  }
  if (productos.length === 0) {
    console.error('✖ El Excel no tiene ningún producto válido; no se generaron semillas.');
    process.exitCode = 1;
    return;
  }

  const existencias = asignarExistencias(productos.map((p) => p.sku));
  const archivos = {
    '01_familias.sql': sqlDeFamilias(productos),
    '02_productos.sql': sqlDeProductos(productos),
    '03_inventario.sql': sqlDeInventario(existencias),
  };
  escribirSemillas(archivos, path.basename(archivo));

  const bajas = existencias.filter((e) => e.baja);
  console.log(`✔ ${contarFamilias(productos)} familia(s) en la hoja (se crean solo las que no existan).`);
  console.log(
    `✔ Existencias iniciales: ${existencias.length - bajas.length} producto(s) entre ` +
      `${EXISTENCIAS_NORMALES.minimo} y ${EXISTENCIAS_NORMALES.maximo} unidades; existencias bajas: ` +
      bajas.map((e) => `${e.sku} (${e.cantidad})`).join(', ')
  );
  console.log(`\n✔ Semillas escritas en ${path.relative(process.cwd(), CLIENT_SEEDS_DIR) || '.'}/`);
  console.log('  Cárguelas con  npm run db:cliente  (BD limpia) o  npm run db:seed:cliente  (incremental).');
}

// El Excel que se pasa por argumento, o el único .xlsx de datos-cliente/
function buscarExcel(ruta) {
  if (ruta) {
    if (fs.existsSync(ruta)) return path.resolve(ruta);
    console.error(`✖ No existe el archivo ${ruta}.`);
    process.exitCode = 1;
    return null;
  }

  const excels = fs.existsSync(CLIENT_DIR)
    ? fs.readdirSync(CLIENT_DIR).filter((f) => f.toLowerCase().endsWith('.xlsx'))
    : [];
  if (excels.length === 1) return path.join(CLIENT_DIR, excels[0]);

  console.error(
    excels.length === 0
      ? `✖ No hay ningún .xlsx en ${CLIENT_DIR}.\n  Copie ahí el Excel del cliente (se pide por Drive/Teams).`
      : `✖ Hay ${excels.length} archivos .xlsx en ${CLIENT_DIR}. Deje uno o pase la ruta:\n` +
          '  npm run db:generar-semillas-cliente -- ruta/al/excel.xlsx'
  );
  process.exitCode = 1;
  return null;
}

async function cargarImportadorDelServidor() {
  const [{ ImportacionDeExcel }, { configuracion }] = await Promise.all([
    import('../../apps/server/modules/admin/importacion/importacion-de-excel.js'),
    import('../../apps/server/configuracion.js'),
  ]);
  return { ImportacionDeExcel, impuestoDeVenta: configuracion.negocio.impuestoDeVenta };
}

/**
 * Corre el importador del servidor sin base de datos: la "transacción" solo
 * ejecuta el trabajo y "guardar" junta los productos ya validados y mapeados.
 * Así las reglas (encabezados, SKU, límites, IVA, URL) son las mismas que las
 * del botón «Cargar Excel».
 */
export async function leerExcel(archivo, { ImportacionDeExcel, impuestoDeVenta }) {
  const productos = [];
  const importacion = new ImportacionDeExcel({
    impuestoDeVenta,
    enTransaccion: (trabajo) => trabajo(null),
    guardarProducto: async (_cliente, producto) => {
      productos.push(producto);
      return { sku: producto.sku, insertado: true };
    },
  });
  const resumen = await importacion.importar(archivo);
  return { resumen, productos };
}

// Existencias iniciales

// Número estable a partir de un texto: el mismo SKU da siempre la misma cantidad
const hash = (texto) => crypto.createHash('sha256').update(texto).digest().readUInt32BE(0);
const enRango = (valor, { minimo, maximo }) => minimo + (valor % (maximo - minimo + 1));

/**
 * Cantidades de prueba reproducibles, sin aleatoriedad real:
 * - cada SKU recibe entre 10 y 30 unidades según el hash de su código;
 * - 2 o 3 SKU (los de menor hash con otra sal) quedan con 0 a 2 unidades.
 * Con el mismo conjunto de SKU sale siempre lo mismo.
 */
export function asignarExistencias(skus) {
  const ordenados = [...skus].sort();
  const cuantasBajas = Math.min(2 + (hash(`cuantas-bajas:${ordenados.join('\n')}`) % 2), skus.length);
  const bajas = new Set(
    [...ordenados]
      .sort((a, b) => hash(`baja:${a}`) - hash(`baja:${b}`) || a.localeCompare(b))
      .slice(0, cuantasBajas)
  );

  return skus.map((sku) =>
    bajas.has(sku)
      ? { sku, cantidad: enRango(hash(`cantidad:${sku}`), EXISTENCIAS_BAJAS), baja: true }
      : { sku, cantidad: enRango(hash(`cantidad:${sku}`), EXISTENCIAS_NORMALES), baja: false }
  );
}

// SQL

/**
 * Literal SQL seguro. Los números también van como texto y se convierten en
 * el SELECT, así toda la entrada pasa por el mismo escape. Cada archivo fija
 * standard_conforming_strings, de modo que solo hay que duplicar las comillas.
 */
export function literal(valor) {
  if (valor === null || valor === undefined) return 'NULL';
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) throw new Error('Número no válido al generar SQL.');
    return `'${valor}'`;
  }
  const texto = String(valor);
  if (texto.includes('\0')) throw new Error('Texto con carácter nulo al generar SQL.');
  return `'${texto.replace(/'/g, "''")}'`;
}

const encabezado = (descripcion) => `-- ${descripcion}
-- Generado por scripts/generar-semillas-cliente.mjs. No editar a mano ni subir a Git.
-- Lo ejecuta db:seed:cliente o db:cliente dentro de una sola transacción.
SET LOCAL standard_conforming_strings = on;
`;

/**
 * Como asegurarFamilia: una familia nueva toma la importación y el margen de
 * la primera fila en que aparece (0 si vienen vacíos). Va una sentencia por
 * familia para que la base descarte también las variantes "Legos"/"legos "
 * dentro del mismo archivo.
 */
function sqlDeFamilias(productos) {
  const primeras = new Map();
  for (const p of productos) {
    if (!primeras.has(p.categoria)) primeras.set(p.categoria, p);
  }

  const sentencias = [...primeras.values()].map(
    (p) => `INSERT INTO catalogo.familia (nombre, importacion, margen_ganancia)
SELECT v.nombre, v.importacion::numeric, v.margen::numeric
  FROM (VALUES (${literal(p.categoria)}, ${literal(p.porcentajeImportacion ?? 0)}, ${literal(p.margenGanancia ?? 0)}))
       AS v (nombre, importacion, margen)
 WHERE NOT EXISTS (SELECT 1 FROM catalogo.familia f WHERE ${nombreComparable('f.nombre')} = ${nombreComparable('v.nombre')})
ON CONFLICT (nombre) DO NOTHING;
`
  );

  return `${encabezado('Familias del Excel del cliente que todavía no existen.')}\n${sentencias.join('\n')}`;
}

/**
 * Mismo upsert que catalogo.repository.js → guardarPorSku. La categoría es el
 * nombre de la familia ya existente que coincide; si no hubiera ninguna,
 * queda NULL y la restricción NOT NULL aborta toda la transacción.
 */
function sqlDeProductos(productos) {
  const filas = productos.map(
    (p) =>
      `       (${[
        p.sku,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.imagenUrl,
        p.costoItem,
        p.porcentajeImportacion,
        p.margenGanancia,
        p.tasaImpuesto,
      ]
        .map(literal)
        .join(', ')})`
  );

  return `${encabezado(`Productos del Excel del cliente (${productos.length}), identificados por SKU.`)}
INSERT INTO catalogo.producto
       (sku, nombre, descripcion, categoria, imagen,
        item, importacion, margen_ganancia, tasa_impuesto)
SELECT v.sku,
       v.nombre,
       v.descripcion,
       (SELECT f.nombre
          FROM catalogo.familia f
         WHERE ${nombreComparable('f.nombre')} = ${nombreComparable('v.familia')}
         ORDER BY f.nombre
         LIMIT 1),
       v.imagen,
       v.item::numeric,
       v.importacion::numeric,
       v.margen::numeric,
       v.tasa::numeric
  FROM (VALUES
${filas.join(',\n')}
       ) AS v (sku, nombre, descripcion, familia, imagen, item, importacion, margen, tasa)
ON CONFLICT (sku) DO UPDATE SET
       nombre          = EXCLUDED.nombre,
       descripcion     = coalesce(EXCLUDED.descripcion, producto.descripcion),
       categoria       = EXCLUDED.categoria,
       imagen          = coalesce(EXCLUDED.imagen, producto.imagen),
       item            = EXCLUDED.item,
       importacion     = EXCLUDED.importacion,
       margen_ganancia = EXCLUDED.margen_ganancia,
       tasa_impuesto   = EXCLUDED.tasa_impuesto;
`;
}

/**
 * Un ingreso por producto con cantidad > 0, con el costo del ítem como costo
 * unitario, y el stock sube en lo mismo. Idempotencia: solo se inicializan
 * los productos que todavía no tienen ningún movimiento de inventario; en
 * cuanto tienen uno (esta carga, un ingreso o una venta) ya no se tocan.
 * Los de 0 unidades no generan movimiento (la BD prohíbe cantidad 0).
 */
function sqlDeInventario(existencias) {
  const filas = existencias.map((e) => `       (${literal(e.sku)}, ${Number(e.cantidad)})`);

  return `${encabezado('Existencias iniciales de prueba (10 a 30 unidades; 2 o 3 productos con 0 a 2).')}
WITH iniciales (sku, cantidad) AS (
  VALUES
${filas.join(',\n')}
),
pendientes AS (
  SELECT i.sku, i.cantidad, p.item
    FROM iniciales i
    JOIN catalogo.producto p ON p.sku = i.sku
   WHERE i.cantidad > 0
     AND NOT EXISTS (SELECT 1 FROM inventario.producto_administra pa WHERE pa.sku = i.sku)
),
movimientos AS (
  INSERT INTO inventario.producto_administra
         (sku, correo_administrador, cantidad, tipo, costo_unitario, motivo)
  SELECT sku,
         (SELECT a.correo_usuario
            FROM admin.administrador a
           ORDER BY a.correo_usuario <> ${literal(SEED_ADMIN_EMAIL)}, a.correo_usuario
           LIMIT 1),
         cantidad,
         'ingreso',
         item,
         ${literal(MOTIVO_EXISTENCIAS_INICIALES)}
    FROM pendientes
  RETURNING sku, cantidad
)
UPDATE catalogo.producto p
   SET stock = p.stock + m.cantidad
  FROM movimientos m
 WHERE p.sku = m.sku;
`;
}

const contarFamilias = (productos) => new Set(productos.map((p) => p.categoria)).size;

// Primero se arma todo en memoria y se escribe en temporales dentro de la
// misma carpeta privada; recién al final se renombran, así nunca queda un
// juego de semillas a medias.
function escribirSemillas(archivos, origen) {
  fs.mkdirSync(CLIENT_SEEDS_DIR, { recursive: true });
  const temporales = Object.entries(archivos).map(([nombre, sql]) => {
    const destino = path.join(CLIENT_SEEDS_DIR, nombre);
    const temporal = `${destino}.tmp`;
    fs.writeFileSync(temporal, `-- Origen: ${origen}\n${sql}`, { mode: 0o600 });
    return [temporal, destino];
  });
  for (const [temporal, destino] of temporales) fs.renameSync(temporal, destino);
}

// Al final del archivo: las constantes de arriba ya están inicializadas
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
