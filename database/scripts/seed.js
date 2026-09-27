// Carga las semillas en una sola transacción: primero semillas/referencia/
// (lo que el sistema necesita para arrancar) y después semillas/demo/ (datos
// de prueba). Dentro de cada carpeta, en orden alfabético.
// Las semillas son idempotentes, así que se pueden correr más de una vez.
//
//   npm run db:seed                         referencia + demo
//   npm run db:seed -- --solo-referencia    sin datos de prueba (p. ej. producción)
const fs = require('fs');
const path = require('path');
const { SEEDS_DIR, SEED_GROUPS, connect, sqlFiles } = require('./lib');

async function seed({ client: external, onlyReference = false } = {}) {
  const client = external || (await connect());
  const groups = onlyReference ? ['referencia'] : SEED_GROUPS;
  try {
    await client.query('BEGIN');
    for (const group of groups) {
      const dir = path.join(SEEDS_DIR, group);
      for (const file of sqlFiles(dir)) {
        process.stdout.write(`→ Semilla ${group}/${file} ... `);
        await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        console.log('ok');
      }
    }
    await client.query('COMMIT');
    console.log(onlyReference ? '✔ Datos de referencia cargados.' : '✔ Datos de referencia y de prueba cargados.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`\n✖ Error cargando semillas: ${err.message}\n  (no se cargó ninguna semilla)\n`);
    process.exitCode = 1;
  } finally {
    if (!external) await client.end();
  }
}

module.exports = { seed };

if (require.main === module) seed({ onlyReference: process.argv.includes('--solo-referencia') });
