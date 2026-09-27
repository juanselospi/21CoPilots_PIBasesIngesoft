// Crea el archivo de la siguiente migración con el número correcto.
//   npm run db:new -- agregar_fecha_retiro_producto
const fs = require('fs');
const path = require('path');
const { MIGRATIONS_DIR, sqlFiles } = require('./lib');

const raw = process.argv.slice(2).join('_');
const name = raw
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '') // quita tildes
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

if (!name) {
  console.error('Uso: npm run db:new -- descripcion_corta_del_cambio');
  process.exit(1);
}

const last = sqlFiles(MIGRATIONS_DIR)
  .map((f) => parseInt(f.slice(0, 3), 10))
  .filter((n) => !Number.isNaN(n))
  .reduce((a, b) => Math.max(a, b), 0);
const version = String(last + 1).padStart(3, '0');
const file = path.join(MIGRATIONS_DIR, `${version}_${name}.sql`);

fs.writeFileSync(
  file,
  `-- =====================================================================
-- ${version} — ${name.replace(/_/g, ' ')}
-- Historia/tarea: SCRUM-XX
-- Justificación: (anótela también en documentos/diseño/modelo-datos.md § 4)
-- Recuerde: nombres calificados por esquema (catalogo.producto, no producto)
-- =====================================================================

`
);
console.log(`✔ Creado ${path.relative(process.cwd(), file)}`);
console.log('  Escriba el SQL, luego:  npm run db:migrate   (o npm run db:reset si necesita repetirla)');
