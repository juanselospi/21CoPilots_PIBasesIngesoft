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

  /** Cookie de sesión. Con `renovar`, una sesión en uso se extiende sola. */
  sesion: Object.freeze({
    duracionMinutos: numero(process.env.DURACION_SESION_MINUTOS, 25),
    renovar: process.env.SESION_RENOVAR === "true",
    cookieSegura: process.env.NODE_ENV === "production",
  }),

  /**
   * RF-54: el enlace para recuperar la contraseña. No hay envío de correos,
   * así que el enlace se escribe en el log y, fuera de producción, también
   * se devuelve en la respuesta para poder probarlo.
   */
  recuperacion: Object.freeze({
    duracionMinutos: numero(process.env.DURACION_RECUPERACION_MINUTOS, 30),
    urlDeLaTienda: process.env.URL_DE_LA_TIENDA ?? "http://localhost:5173",
    devolverEnlace: process.env.NODE_ENV !== "production",
  }),

  /** Importación del Excel de productos. La hoja real pesa unos pocos KB. */
  importacion: Object.freeze({
    tamanoMaximoMb: numero(process.env.IMPORTACION_TAMANO_MAXIMO_MB, 5),
  }),

  /** Valores de negocio fijados por ley o por el SRS; no son editables.
      13 %, es la tasa que la importacion guarda en cada producto.
  */
  negocio: Object.freeze({
    impuestoDeVenta: numero(process.env.IMPUESTO_DE_VENTA, 0.13),
    umbralDeExistenciasBajas: numero(process.env.UMBRAL_EXISTENCIAS_BAJAS, 2),
  }),

  /** RES-03 — ambos sistemas externos son placeholder en esta versión. */
  adaptadores: Object.freeze({
    pasarelaDePago: process.env.PASARELA_DE_PAGO ?? "simulada",
    facturacionElectronica: process.env.FACTURACION_ELECTRONICA ?? "simulada",
  }),
});
