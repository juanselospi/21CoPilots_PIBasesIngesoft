// Ejecuta las pruebas SQL de database/pruebas contra la BD local.
//   npm run db:test
//
// Cada archivo corre en su propia transacción, precedido por _ayudantes.sql,
// y al final se revierte: las pruebas nunca dejan datos. Un archivo se detiene
// en su primera prueba fallida.
const fs = require('fs');
const path = require('path');
const { TESTS_DIR, connect, sqlFiles } = require('./lib');

async function probar() {
  const client = await connect();
  const helpers = fs.readFileSync(path.join(TESTS_DIR, '_ayudantes.sql'), 'utf8');
  let passed = 0;
  let failedFiles = 0;

  // Cada prueba aprobada emite un NOTICE que empieza con ✔
  client.on('notice', (n) => {
    if (n.message.startsWith('✔')) {
      passed++;
      console.log(`    ${n.message}`);
    }
  });

  try {
    for (const file of sqlFiles(TESTS_DIR).filter((f) => !f.startsWith('_'))) {
      console.log(`→ ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(helpers);
        await client.query(fs.readFileSync(path.join(TESTS_DIR, file), 'utf8'));
      } catch (err) {
        failedFiles++;
        console.error(`    ${err.message}`);
      } finally {
        await client.query('ROLLBACK');
      }
    }
  } finally {
    await client.end();
  }

  if (failedFiles) {
    console.error(`\n✖ ${passed} prueba(s) aprobada(s); ${failedFiles} archivo(s) con fallas.`);
    process.exitCode = 1;
  } else {
    console.log(`\n✔ ${passed} prueba(s) aprobada(s).`);
  }
}

probar();
