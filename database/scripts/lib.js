// Utilidades compartidas por los scripts de base de datos.
// Adaptado del prototipo kit-bd-21copilots_4.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Todo lo de la base de datos vive en database/: .env, docker-compose.yml y package.json
const DB_DIR = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(DB_DIR, '.env') });

const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(DB_DIR, 'migraciones');
const SEEDS_DIR = path.join(DB_DIR, 'semillas');
const TESTS_DIR = path.join(DB_DIR, 'pruebas');

// Orden de carga de las semillas: primero lo que el sistema necesita para
// arrancar, después los datos de prueba
const SEED_GROUPS = ['referencia', 'demo'];

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'dchobbies',
  user: process.env.DB_USER || 'dchobbies',
  password: process.env.DB_PASSWORD || 'dchobbies_dev',
};

async function connect() {
  const client = new Client(config);
  try {
    await client.connect();
  } catch (err) {
    console.error(
      `\n✖ No se pudo conectar a PostgreSQL en ${config.host}:${config.port} (${err.code || err.message}).\n` +
        '  ¿Está levantado el contenedor?  ->  npm run db:up\n' +
        '  ¿Copió el .env?                 ->  cp .env.example .env\n'
    );
    process.exit(1);
  }
  return client;
}

function sqlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function checksum(text) {
  // Normaliza saltos de línea para que Windows (CRLF) y Linux (LF) den el mismo resultado
  return crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);
}

function isLocalHost() {
  return ['localhost', '127.0.0.1', '::1'].includes(config.host);
}

module.exports = {
  DB_DIR,
  MIGRATIONS_DIR,
  SEEDS_DIR,
  SEED_GROUPS,
  TESTS_DIR,
  config,
  connect,
  sqlFiles,
  checksum,
  isLocalHost,
};
