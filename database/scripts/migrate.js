// Aplica, en orden, las migraciones de database/migraciones que aún no se han aplicado.
//
//   npm run db:migrate          aplica las pendientes
//   npm run db:status           solo muestra el estado
//
// Cada migración corre en su propia transacción: si falla, no queda a medias.
// Se guarda un checksum de cada archivo aplicado; si alguien edita una
// migración que ya estaba aplicada, el script se detiene y lo avisa.
const fs = require('fs');
const path = require('path');
const { MIGRATIONS_DIR, connect, sqlFiles, checksum } = require('./lib');

const NAME_RE = /^(\d{3})_[a-z0-9_]+\.sql$/;

function loadMigrations() {
  const files = sqlFiles(MIGRATIONS_DIR);
  const seen = new Map();
  return files.map((file) => {
    const m = NAME_RE.exec(file);
    if (!m) {
      throw new Error(`Nombre inválido "${file}". Formato: 009_descripcion_en_snake_case.sql`);
    }
    const version = m[1];
    if (seen.has(version)) {
      throw new Error(
        `Dos migraciones con el número ${version}: "${seen.get(version)}" y "${file}".\n` +
          '  Pasa cuando dos ramas crean migraciones a la vez. Renumere la suya (la que aún no está en main).'
      );
    }
    seen.set(version, file);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    return { version, file, sql, checksum: checksum(sql) };
  });
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.esquema_version (
      version     VARCHAR(3)   PRIMARY KEY,
      archivo     VARCHAR(255) NOT NULL,
      checksum    VARCHAR(16)  NOT NULL,
      aplicada_en TIMESTAMPTZ  NOT NULL DEFAULT now()
    )`);
}

async function migrate({ statusOnly = false, client: external } = {}) {
  const client = external || (await connect());
  try {
    await ensureTable(client);
    const migrations = loadMigrations();
    const { rows } = await client.query('SELECT version, archivo, checksum FROM public.esquema_version');
    const applied = new Map(rows.map((r) => [r.version, r]));

    // 1) Detectar migraciones aplicadas que fueron editadas después
    const edited = migrations.filter((m) => applied.has(m.version) && applied.get(m.version).checksum !== m.checksum);
    // 2) Detectar migraciones aplicadas que ya no existen en esta rama
    const orphan = rows.filter((r) => !migrations.some((m) => m.version === r.version));

    if (statusOnly) {
      console.log('\nEstado de migraciones:');
      for (const m of migrations) {
        const a = applied.get(m.version);
        const mark = !a ? '· pendiente ' : a.checksum !== m.checksum ? '✖ EDITADA  ' : '✔ aplicada  ';
        console.log(`  ${mark} ${m.file}`);
      }
      for (const o of orphan) console.log(`  ? no está en esta rama: ${o.archivo}`);
      console.log('');
      return;
    }

    if (edited.length) {
      console.error(
        '\n✖ Estas migraciones ya estaban aplicadas en su BD y su contenido cambió:\n' +
          edited.map((m) => `    - ${m.file}`).join('\n') +
          '\n\n  Regla del equipo: una migración que ya está en main NO se edita; se crea una nueva.\n' +
          '  Si la migración es suya y todavía no está en main, reconstruya su BD local con:  npm run db:reset\n'
      );
      process.exitCode = 1;
      return;
    }
    if (orphan.length) {
      console.warn(
        '⚠ Su BD tiene migraciones que no existen en esta rama (¿cambió de rama?):\n' +
          orphan.map((o) => `    - ${o.archivo}`).join('\n') +
          '\n  Si algo falla, use:  npm run db:reset\n'
      );
    }

    const pending = migrations.filter((m) => !applied.has(m.version));
    if (!pending.length) {
      console.log('✔ La base de datos está al día. No hay migraciones pendientes.');
      return;
    }

    for (const m of pending) {
      process.stdout.write(`→ Aplicando ${m.file} ... `);
      try {
        await client.query('BEGIN');
        await client.query(m.sql);
        await client.query('INSERT INTO public.esquema_version (version, archivo, checksum) VALUES ($1, $2, $3)', [
          m.version,
          m.file,
          m.checksum,
        ]);
        await client.query('COMMIT');
        console.log('ok');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FALLÓ');
        console.error(`\n✖ Error en ${m.file}: ${err.message}\n  (se revirtió; la BD quedó como antes de esta migración)\n`);
        process.exitCode = 1;
        return;
      }
    }
    console.log(`✔ ${pending.length} migración(es) aplicada(s).`);
  } finally {
    if (!external) await client.end();
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate({ statusOnly: process.argv.includes('--status') }).catch((err) => {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  });
}
