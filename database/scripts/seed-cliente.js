// Carga las semillas privadas del cliente (datos-cliente/semillas/*.sql, que
// genera db:generar-semillas-cliente) sobre la base actual, sin borrar nada.
// Todo va en una sola transacción: o se cargan todos los archivos o ninguno.
//
//   npm run db:seed:cliente
//
// Se puede correr más de una vez: las familias y los productos se crean o se
// actualizan por nombre y SKU, y las existencias iniciales solo se dan a los
// productos que todavía no tienen movimientos de inventario.
// No necesita el servidor ni el Excel. Nunca la llaman db:seed ni db:reset.
const fs = require('fs');
const path = require('path');
const { CLIENT_SEEDS_DIR, connect, sqlFiles } = require('./lib');

// Archivos de semillas del cliente en orden, o null si todavía no se generaron
function clientSeedFiles() {
  const files = sqlFiles(CLIENT_SEEDS_DIR);
  if (files.length > 0) return files;

  console.error(
    `Error: No hay semillas del cliente en ${CLIENT_SEEDS_DIR}.\n` +
      '  Genérelas desde el Excel:  npm run db:generar-semillas-cliente'
  );
  process.exitCode = 1;
  return null;
}

// Ejecuta los archivos con el cliente recibido; la transacción la abre quien llama
async function runClientSeeds(client, files) {
  const { rows } = await client.query('SELECT count(*)::int AS total FROM admin.administrador');
  if (rows[0].total === 0) {
    throw new Error('No hay ningún administrador para firmar los movimientos de inventario. Cargue antes las semillas demo (npm run db:reset).');
  }

  for (const file of files) {
    process.stdout.write(`Semilla cliente/${file} ... `);
    await client.query(fs.readFileSync(path.join(CLIENT_SEEDS_DIR, file), 'utf8'));
    console.log('ok');
  }
}

// Resumen sin costos ni márgenes: solo conteos
async function printSummary(client) {
  const { rows } = await client.query(`
    SELECT count(*)::int                                                  AS productos,
           count(*) FILTER (WHERE stock > 0)::int                         AS con_existencias,
           (SELECT count(*)::int FROM catalogo.familia)                   AS familias,
           (SELECT count(*)::int FROM inventario.producto_administra)     AS movimientos
      FROM catalogo.producto`);
  const r = rows[0];
  console.log(`${r.productos} producto(s) (${r.con_existencias} con existencias), ${r.familias} familia(s), ${r.movimientos} movimiento(s) de inventario.`);
}

module.exports = { clientSeedFiles, runClientSeeds, printSummary };

if (require.main === module) {
  (async () => {
    const files = clientSeedFiles();
    if (!files) return;

    const client = await connect();
    try {
      await client.query('BEGIN');
      await runClientSeeds(client, files);
      await client.query('COMMIT');
      await printSummary(client);
      console.log('\nSemillas del cliente cargadas.');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`\nError cargando las semillas del cliente: ${err.message}\n  (no se cargó ninguna)\n`);
      process.exitCode = 1;
    } finally {
      await client.end();
    }
  })();
}
