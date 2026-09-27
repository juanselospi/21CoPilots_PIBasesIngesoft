// Genera database/schema.sql: el DDL completo y actual (entregable "Script de BD" del curso).
// Se obtiene con pg_dump desde el contenedor, así que refleja exactamente lo que
// producen las migraciones. Regenérelo antes de cada entrega y súbalo en el PR.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DB_DIR, config } = require('./lib');

const out = path.join(DB_DIR, 'schema.sql');
const res = spawnSync(
  'docker',
  [
    'compose', 'exec', '-T', 'db',
    'pg_dump', '-U', config.user, '-d', config.database,
    '--schema-only', '--no-owner', '--no-privileges',
    '--exclude-table=public.esquema_version',
  ],
  // docker-compose.yml está en database/
  { cwd: DB_DIR, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
);

if (res.status !== 0) {
  console.error(`✖ pg_dump falló:\n${res.stderr || res.error}`);
  process.exit(1);
}

// Quita líneas \restrict/\unrestrict (pg_dump >= 17.6) y la cabecera de versión,
// para que el archivo no cambie en cada ejecución y el diff en Git sea limpio.
const body = res.stdout
  .split('\n')
  .filter((l) => !/^\\(un)?restrict /.test(l) && !/^-- Dumped (from|by) /.test(l))
  .join('\n');

const header =
  '-- =====================================================================\n' +
  '-- DDL completo de DC Hobbies Cultura Geek Online (PostgreSQL)\n' +
  '-- GENERADO AUTOMÁTICAMENTE con `npm run db:dump`. No lo edite a mano:\n' +
  '-- los cambios se hacen con migraciones en database/migraciones/.\n' +
  '-- =====================================================================\n';

fs.writeFileSync(out, header + body);
console.log(`✔ DDL escrito en ${path.relative(process.cwd(), out)}`);
