/**
 * Traductor de errores a respuestas HTTP.
 *
 * Último eslabón de la cadena de middlewares (§ 6.1). Es el único lugar
 * que decide códigos de estado, y nunca filtra la traza al cliente.
 */

const CODIGO_HTTP_POR_ERROR = {
  RECURSO_NO_ENCONTRADO: 404,
  REGLA_DE_NEGOCIO_VIOLADA: 409,
  NO_AUTENTICADO: 401,
  CREDENCIALES_INVALIDAS: 401,
  NO_AUTORIZADO: 403,
  ENTRADA_INVALIDA: 400,
};

/**
 * Restricciones de la base de datos que se dispararon. Son la segunda
 * línea de defensa (§ 9.2): si llegan aquí, el servicio dejó pasar algo.
 * El mensaje es fijo para no exponer nombres de tablas ni columnas.
 */
const ERROR_DE_POSTGRES = {
  23001: { codigo: "REGISTRO_HISTORICO", mensaje: "Los registros históricos no se pueden modificar." }, // DD-16
  23503: { codigo: "REFERENCIA_INVALIDA", mensaje: "Los datos hacen referencia a un registro que no existe o que todavía se usa." },
  23505: { codigo: "REGISTRO_DUPLICADO", mensaje: "Ya existe un registro con esos datos." },
  23514: { codigo: "RESTRICCION_VIOLADA", mensaje: "La operación viola una restricción de los datos." },
};

export function manejadorDeErrores(error, _peticion, respuesta, _siguiente) {
  const dePostgres = ERROR_DE_POSTGRES[error?.code];
  if (dePostgres) {
    respuesta.status(409).json({ error: { ...dePostgres, detalles: null } });
    return;
  }

  const estado = CODIGO_HTTP_POR_ERROR[error?.codigo] ?? 500;

  if (estado >= 500) {
    console.error("Error no controlado:", error);
  }

  respuesta.status(estado).json({
    error: {
      codigo: estado >= 500 ? "ERROR_INTERNO" : error.codigo,
      mensaje:
        estado >= 500
          ? "Ocurrió un error inesperado. Intente de nuevo."
          : error.message,
      detalles: estado >= 500 ? null : error.detalles ?? null,
    },
  });
}
