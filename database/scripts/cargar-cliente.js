//   npm run db:cliente                       usa el .xlsx de database/datos-cliente/
//   npm run db:cliente -- ruta/al/excel.xlsx
// Hace db:reset, oculta los productos de prueba, sube el Excel por el servidor
// (igual que "Cargar Excel") y da existencias iniciales a los importados.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { DB_DIR, connect, config, isLocalHost } = require('./lib');

const CARPETA_DE_DATOS = path.join(DB_DIR, 'datos-cliente');
const SERVIDOR_URL = process.env.SERVIDOR_URL || 'http://localhost:3000';

// Administrador de las semillas (semillas/demo/01_usuarios.sql)
const ADMINISTRADOR = { correo: 'admin@dchobbies.test', contrasena: 'Admin123!' };
const EXISTENCIAS_INICIALES = 1;

(async () => {
  if (!isLocalHost()) {
    console.error(`✖ DB_HOST es "${config.host}", no una BD local. db:cliente borra todo, así que se negó a correr.`);
    process.exit(1);
  }

  const archivo = buscarExcel(process.argv[2]);
  if (!archivo) return;

  // Antes de borrar nada se revisa que el servidor responda, porque la
  // importación pasa por él
  if (!(await servidorArriba())) return;

  console.log('→ Reconstruyendo la base con las semillas ...');
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'reset.js')], { stdio: 'inherit' });
  } catch {
    process.exitCode = 1;
    return; // reset.js ya explicó el error
  }

  const client = await connect();
  try {
    const deprueba = await ocultarProductosDePrueba(client);
    console.log(`✔ ${deprueba.length} producto(s) de prueba ocultos (siguen en la base).`);

    console.log(`→ Importando ${path.basename(archivo)} por ${SERVIDOR_URL} ...`);
    const resumen = await importarPorElServidor(archivo);
    console.log(`✔ Filas leídas: ${resumen.leidas}, importadas: ${resumen.importadas}, rechazadas: ${resumen.rechazadas.length}.`);
    for (const { fila, codigoSku, motivos } of resumen.rechazadas) {
      console.log(`  · Fila ${fila} (${codigoSku ?? 'sin código'}): ${motivos.join('; ')}`);
    }

    const conExistencias = await registrarExistenciasIniciales(client, deprueba);
    console.log(`✔ ${conExistencias} producto(s) con ${EXISTENCIAS_INICIALES} unidad de existencia.`);
    console.log('\n✔ Base lista con el catálogo del cliente.');
  } catch (err) {
    console.error(`\n✖ ${err.message}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

// El Excel que se pasa por argumento, o el único .xlsx de datos-cliente/
function buscarExcel(ruta) {
  if (ruta) {
    if (fs.existsSync(ruta)) return path.resolve(ruta);
    console.error(`✖ No existe el archivo ${ruta}.`);
    process.exitCode = 1;
    return null;
  }

  const excels = fs.existsSync(CARPETA_DE_DATOS)
    ? fs.readdirSync(CARPETA_DE_DATOS).filter((f) => f.toLowerCase().endsWith('.xlsx'))
    : [];
  if (excels.length === 1) return path.join(CARPETA_DE_DATOS, excels[0]);

  console.error(
    excels.length === 0
      ? `✖ No hay ningún .xlsx en ${CARPETA_DE_DATOS}.\n  Copie ahí el Excel del cliente (se pide por Drive/Teams).`
      : `✖ Hay ${excels.length} archivos .xlsx en ${CARPETA_DE_DATOS}. Deje uno o pase la ruta:\n  npm run db:cliente -- ruta/al/excel.xlsx`
  );
  process.exitCode = 1;
  return null;
}

async function servidorArriba() {
  try {
    const respuesta = await fetch(`${SERVIDOR_URL}/api/salud`);
    if (respuesta.ok) return true;
  } catch {
    // se informa abajo
  }
  console.error(
    `✖ El servidor no responde en ${SERVIDOR_URL}.\n` +
    '  Levántelo en otra terminal:  npm --prefix apps/server run dev'
  );
  process.exitCode = 1;
  return false;
}

async function ocultarProductosDePrueba(client) {
  await client.query('BEGIN');
  try {
    const { rows } = await client.query(
      `SELECT sku, stock FROM catalogo.producto ORDER BY sku FOR UPDATE`
    );

    for (const { sku, stock } of rows.filter((p) => p.stock > 0)) {
      await client.query(
        `INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
         VALUES ($1, $2, $3)`,
        [sku, ADMINISTRADOR.correo, -stock]
      );
    }
    await client.query(`UPDATE catalogo.producto SET stock = 0, contrapedido = false`);

    await client.query('COMMIT');
    return rows.map((p) => p.sku);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// Inicia sesión como administrador y sube el Excel, igual que "Cargar Excel"
async function importarPorElServidor(archivo) {
  const sesion = await fetch(`${SERVIDOR_URL}/api/admin/sesion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMINISTRADOR),
  });
  if (!sesion.ok) throw new Error(`No se pudo iniciar sesión como ${ADMINISTRADOR.correo} (HTTP ${sesion.status}).`);
  const cookie = sesion.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

  const formulario = new FormData();
  formulario.append('archivo', new Blob([fs.readFileSync(archivo)]), path.basename(archivo));

  const respuesta = await fetch(`${SERVIDOR_URL}/api/admin/importaciones`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: formulario,
  });
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(`El servidor rechazó el Excel (HTTP ${respuesta.status}): ${cuerpo?.error?.mensaje ?? 'sin detalle'}`);
  }
  return cuerpo.datos;
}

async function registrarExistenciasIniciales(client, deprueba) {
  await client.query('BEGIN');
  try {
    const { rows } = await client.query(
      `SELECT sku
         FROM catalogo.producto
        WHERE sku <> ALL($1::text[])
        ORDER BY sku
          FOR UPDATE`,
      [deprueba]
    );
    const skus = rows.map((p) => p.sku);

    await client.query(
      `INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
       SELECT unnest($1::text[]), $2, $3`,
      [skus, ADMINISTRADOR.correo, EXISTENCIAS_INICIALES]
    );
    await client.query(
      `UPDATE catalogo.producto SET stock = stock + $2 WHERE sku = ANY($1::text[])`,
      [skus, EXISTENCIAS_INICIALES]
    );

    await client.query('COMMIT');
    return skus.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}
