/**
 * Middleware que recibe el Excel de productos en el campo `archivo`.
 *
 * El archivo se queda en memoria (peticion.file.buffer): es pequeño y así
 * no quedan archivos temporales en el disco. Si no es .xlsx o pesa
 * demasiado, se responde 400 con un mensaje que el administrador entienda.
 * Que el contenido sea un Excel de verdad lo revisa después el parser.
 */

import multer from "multer";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

export const CAMPO_DEL_ARCHIVO = "archivo";

export function crearRecibirExcel({ tamanoMaximoMb }) {
  const subir = multer({
    storage: multer.memoryStorage(),
    // multer exige un entero; con 2.5 MB en la configuración daría decimales.
    limits: { fileSize: Math.floor(tamanoMaximoMb * 1024 * 1024), files: 1 },
    fileFilter: (_peticion, archivo, aceptar) => {
      if (/\.xlsx$/i.test(archivo.originalname)) {
        aceptar(null, true);
      } else {
        aceptar(new EntradaInvalida("Solo se aceptan archivos de Excel (.xlsx).", [CAMPO_DEL_ARCHIVO]));
      }
    },
  }).single(CAMPO_DEL_ARCHIVO);

  return (peticion, respuesta, siguiente) => {
    subir(peticion, respuesta, (error) => {
      if (!error || error instanceof EntradaInvalida) {
        siguiente(error);
      } else if (error.code === "LIMIT_FILE_SIZE") {
        siguiente(new EntradaInvalida(`El archivo pesa más de ${tamanoMaximoMb} MB.`, [CAMPO_DEL_ARCHIVO]));
      } else if (error instanceof multer.MulterError) {
        // Por ejemplo, más de un archivo o el archivo en otro campo.
        siguiente(new EntradaInvalida(`Envíe un solo archivo en el campo "${CAMPO_DEL_ARCHIVO}".`, [CAMPO_DEL_ARCHIVO]));
      } else {
        siguiente(error);
      }
    });
  };
}
