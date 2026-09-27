// Borra TODA la base de datos local y la reconstruye: migraciones + semillas.
// Úselo cuando: se une al proyecto, cambia de rama, algo quedó raro o
// está iterando sobre una migración propia que aún no está en main.
//
//   npm run db:reset                         migraciones + referencia + demo
//   npm run db:reset -- --solo-referencia    sin datos de prueba
const { connect, config, isLocalHost } = require('./lib');
const { migrate } = require('./migrate');
const { seed } = require('./seed');

(async () => {
  if (!isLocalHost() && !process.argv.includes('--force')) {
    console.error(
      `✖ DB_HOST es "${config.host}", no una BD local. db:reset borra todo, así que se negó a correr.\n` +
        '  Si de verdad quiere hacerlo:  npm run db:reset -- --force'
    );
    process.exit(1);
  }
  const client = await connect();
  try {
    console.log(`→ Borrando todo en ${config.database}@${config.host}:${config.port} ...`);
    // Cada módulo tiene su propio esquema (DD-11): se borran todos los esquemas
    // del usuario, no solo public
    const { rows } = await client.query(`
      SELECT nspname FROM pg_namespace
      WHERE  nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema'`);
    for (const { nspname } of rows) {
      await client.query(`DROP SCHEMA "${nspname.replace(/"/g, '""')}" CASCADE`);
    }
    await client.query('CREATE SCHEMA public');
    await migrate({ client });
    if (process.exitCode) return;
    await seed({ client, onlyReference: process.argv.includes('--solo-referencia') });
    if (!process.exitCode) console.log('\n✔ BD reconstruida desde cero.');
  } finally {
    await client.end();
  }
})();
