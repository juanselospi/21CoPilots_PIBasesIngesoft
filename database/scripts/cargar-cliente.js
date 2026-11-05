// Deja la base local con el catálogo real del cliente. BORRA TODO.
//
//   npm run db:cliente
//
// 1. db:reset: migraciones + semillas demo (usuarios, pedidos, etc.).
// 2. Desactiva los productos de prueba (estado «descontinuado», como el botón
//    «Desactivar»): salen de la tienda, de las alertas de existencias bajas y
//    del listado por defecto del panel, pero siguen en la base con su stock y
//    todo lo que los referencia (pedidos y movimientos demo).
// 3. Carga las semillas privadas de datos-cliente/semillas/ (familias,
//    productos y existencias iniciales de prueba).
// Los pasos 2 y 3 van en una sola transacción.
//
// No necesita el servidor ni el Excel: las semillas se generan antes con
//   npm run db:generar-semillas-cliente
const path = require('path');
const { execFileSync } = require('child_process');
const { connect, config, isLocalHost } = require('./lib');
const { clientSeedFiles, runClientSeeds, printSummary } = require('./seed-cliente');

(async () => {
  if (!isLocalHost()) {
    console.error(`✖ DB_HOST es "${config.host}", no una BD local. db:cliente borra todo, así que se negó a correr.`);
    process.exit(1);
  }

  // Antes de borrar nada se revisa que las semillas del cliente existan
  const files = clientSeedFiles();
  if (!files) return;

  console.log('→ Reconstruyendo la base con las semillas demo ...');
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'reset.js')], { stdio: 'inherit' });
  } catch {
    process.exitCode = 1;
    return; // reset.js ya explicó el error
  }

  const client = await connect();
  try {
    await client.query('BEGIN');
    const deprueba = await desactivarProductosDePrueba(client);
    console.log(`✔ ${deprueba} producto(s) de prueba desactivados (siguen en la base).`);
    await runClientSeeds(client, files);
    await client.query('COMMIT');

    await printSummary(client);
    console.log('\n✔ Base lista con el catálogo del cliente.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`\n✖ ${err.message}\n  (quedó la base demo recién reconstruida, sin datos del cliente)`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

// Justo después del reset, todos los productos son de prueba. Igual que
// «Desactivar» (RF-18): solo cambia el estado, sin tocar stock ni historial.
async function desactivarProductosDePrueba(client) {
  const { rowCount } = await client.query(
    `UPDATE catalogo.producto SET estado = 'descontinuado' WHERE estado <> 'descontinuado'`
  );
  return rowCount;
}
