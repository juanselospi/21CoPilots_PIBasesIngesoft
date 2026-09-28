/**
 * Configuración del proceso.
 *
 * Único punto donde se lee `process.env` (§ 15, convención 5). Ningún
 * módulo de dominio consulta variables de entorno: reciben sus valores por
 * parámetro, lo que los deja probables sin montar el entorno completo.
 *
 * Aquí solo viven los valores de infraestructura y los fijados por ley o
 * por el SRS. Los que edita el administrador (escala de niveles, monto
 * mínimo de descuento) viven en tablas de la base de datos (DD-14).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Se lee apps/server/.env sin importar desde qué carpeta se arranque.
const directorioDelServidor = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(directorioDelServidor, ".env") });

const numero = (valor, porDefecto) =>
  valor !== undefined && valor !== "" && Number.isFinite(Number(valor))
    ? Number(valor)
    : porDefecto;

export const configuracion = Object.freeze({
  puerto: numero(process.env.PUERTO, 3000),

  baseDeDatos: Object.freeze({
    host: process.env.DB_HOST ?? "localhost",
    puerto: numero(process.env.DB_PORT, 5433),
    nombre: process.env.DB_NAME ?? "dchobbies",
    usuario: process.env.DB_USER ?? "dchobbies",
    contrasena: process.env.DB_PASSWORD ?? "",
  }),

  /** RF-53 — cookie de sesión; `Secure` solo en producción (HTTPS). */
  sesion: Object.freeze({
    duracionHoras: numero(process.env.DURACION_SESION_HORAS, 8),
    cookieSegura: process.env.NODE_ENV === "production",
  }),

  /** Valores de negocio fijados por ley o por el SRS; no son editables. */
  negocio: Object.freeze({
    /** RES-06 — 13 % sobre el precio sin impuesto. */
    impuestoDeVenta: numero(process.env.IMPUESTO_DE_VENTA, 0.13),
    /** RN-04 — umbral fijo e igual para todos los productos. */
    umbralDeExistenciasBajas: numero(process.env.UMBRAL_EXISTENCIAS_BAJAS, 2),
  }),

  /** RES-03 — ambos sistemas externos son placeholder en esta versión. */
  adaptadores: Object.freeze({
    pasarelaDePago: process.env.PASARELA_DE_PAGO ?? "simulada",
    facturacionElectronica: process.env.FACTURACION_ELECTRONICA ?? "simulada",
  }),
});
