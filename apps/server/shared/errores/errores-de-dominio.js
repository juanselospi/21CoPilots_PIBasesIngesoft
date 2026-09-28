/**
 * Errores de dominio.
 *
 * El dominio no conoce HTTP: lanza errores con significado de negocio y
 * es la capa de API la que los traduce a códigos de estado. Así la misma
 * lógica sirve para un endpoint, un script de importación o una prueba.
 */

export class ErrorDeDominio extends Error {
  constructor(mensaje, { codigo = "ERROR_DE_DOMINIO", detalles = null } = {}) {
    super(mensaje);
    this.name = new.target.name;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** El recurso solicitado no existe o no es visible para quien pregunta. */
export class RecursoNoEncontrado extends ErrorDeDominio {
  constructor(recurso, identificador) {
    super(`No existe ${recurso} con identificador ${identificador}.`, {
      codigo: "RECURSO_NO_ENCONTRADO",
    });
  }
}

/** Una regla de negocio (RN-xx) impide completar la operación. */
export class ReglaDeNegocioViolada extends ErrorDeDominio {
  constructor(mensaje, regla) {
    super(mensaje, { codigo: "REGLA_DE_NEGOCIO_VIOLADA", detalles: { regla } });
  }
}

/** Falta identificarse (RF-50). */
export class NoAutenticado extends ErrorDeDominio {
  constructor() {
    super("Se requiere iniciar sesión.", { codigo: "NO_AUTENTICADO" });
  }
}

/** Correo o contraseña incorrectos (RF-53). Un solo mensaje para ambos casos. */
export class CredencialesInvalidas extends ErrorDeDominio {
  constructor() {
    super("Correo o contraseña incorrectos.", { codigo: "CREDENCIALES_INVALIDAS" });
  }
}

/** Identificado, pero sin el rol necesario (RF-50, RNF-10). */
export class NoAutorizado extends ErrorDeDominio {
  constructor(accion) {
    super("No tiene permiso para realizar esta acción.", {
      codigo: "NO_AUTORIZADO",
      detalles: { accion },
    });
  }
}

/** Datos de entrada inválidos. */
export class EntradaInvalida extends ErrorDeDominio {
  constructor(mensaje, campos = null) {
    super(mensaje, { codigo: "ENTRADA_INVALIDA", detalles: { campos } });
  }
}
