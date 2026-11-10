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

const adaptadorDeCorreo = process.env.CORREO || "simulado";

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
    // Tras tantos intentos fallidos con un correo dentro de la ventana, ese correo espera el bloqueo
    intentosMaximos: numero(process.env.INTENTOS_DE_INICIO_MAXIMOS, 5),
    ventanaDeIntentosMinutos: numero(process.env.VENTANA_DE_INTENTOS_MINUTOS, 15),
    bloqueoMinutos: numero(process.env.BLOQUEO_DE_INICIO_MINUTOS, 10),
  }),

  /**
   * RF-54: el enlace para recuperar la contraseña. Solo se devuelve en la
   * respuesta con el correo simulado y fuera de producción, para poder
   * probarlo. Con correo real nadie más que el dueño puede verlo.
   */
  recuperacion: Object.freeze({
    duracionMinutos: numero(process.env.DURACION_RECUPERACION_MINUTOS, 30),
    urlDeLaTienda: process.env.URL_DE_LA_TIENDA ?? "http://localhost:5173",
    devolverEnlace: process.env.NODE_ENV !== "production" && adaptadorDeCorreo === "simulado",
    esperaEntreEnlacesSegundos: numero(process.env.ESPERA_ENTRE_ENLACES_SEGUNDOS, 60),
  }),

  // simulado escribe el correo en el log, smtp lo manda de verdad
  correo: Object.freeze({
    adaptador: adaptadorDeCorreo,
    smtp: Object.freeze({
      host: process.env.SMTP_HOST ?? "",
      puerto: numero(process.env.SMTP_PORT, 465),
      usuario: process.env.SMTP_USUARIO ?? "",
      contrasena: process.env.SMTP_CONTRASENA ?? "",
      remitente: process.env.CORREO_REMITENTE ?? "",
    }),
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

  /** RES-03: ambos sistemas externos son placeholder en esta versión. */
  adaptadores: Object.freeze({
    pasarelaDePago: process.env.PASARELA_DE_PAGO ?? "simulada",
    facturacionElectronica: process.env.FACTURACION_ELECTRONICA ?? "simulada",
  }),
});
