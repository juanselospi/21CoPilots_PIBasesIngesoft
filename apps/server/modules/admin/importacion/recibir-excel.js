/**
 * Recibe el Excel de productos en el campo `archivo`.
 */

import multer from "multer";
import { EntradaInvalida } from "../../../shared/errores/errores-de-dominio.js";

export const CAMPO_DEL_ARCHIVO = "archivo";

export function crearRecibirExcel({ tamanoMaximoMb }) {
  const subir = multer({
    storage: multer.memoryStorage(),
    // multer exige un entero
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
        // más de un archivo o el archivo en otro campo
        siguiente(new EntradaInvalida(`Envíe un solo archivo en el campo "${CAMPO_DEL_ARCHIVO}".`, [CAMPO_DEL_ARCHIVO]));
      } else {
        siguiente(error);
      }
    });
  };
}
