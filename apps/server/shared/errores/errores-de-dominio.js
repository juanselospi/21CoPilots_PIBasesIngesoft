/**
 * Errores de dominio.
 *
 * El dominio no conoce HTTP: lanza errores con significado de negocio y
 * es la capa de API la que los traduce a códigos de estado
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

/** Un dato que tiene que ser único ya está registrado, como un correo o una cédula. */
export class DatoDuplicado extends ErrorDeDominio {
  constructor(mensaje, campos) {
    super(mensaje, { codigo: "DATO_DUPLICADO", detalles: { campos } });
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

/** Correo o contraseña incorrectos. Un solo mensaje para ambos casos. */
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

/**
 * Datos de entrada inválidos. `campos` es la lista de nombres que ya lee el
 * cliente; `errores` trae además el mensaje de cada uno.
 */
export class EntradaInvalida extends ErrorDeDominio {
  constructor(mensaje, campos = null, errores = null) {
    super(mensaje, { codigo: "ENTRADA_INVALIDA", detalles: { campos, errores } });
  }
}

/** Un producto con ventas o movimientos no se borra: se desactiva (RF-18). */
export class ProductoConHistorial extends ErrorDeDominio {
  constructor() {
    super("Este producto tiene ventas o movimientos; desactívelo en su lugar.", {
      codigo: "PRODUCTO_CON_HISTORIAL",
    });
  }
}

/**
 * Al confirmar, alguna línea ya no tiene las unidades que pide (otro cliente
 * compró antes). `lineas` dice cuáles para marcarlas en el carrito.
 */
export class SinExistencias extends ErrorDeDominio {
  constructor(lineas) {
    super("Algunos productos ya no tienen las unidades que pidió. Revise su carrito.", {
      codigo: "SIN_EXISTENCIAS",
      detalles: { lineas },
    });
  }
}

/** La pasarela rechazó el cobro; no se creó el pedido y el carrito sigue igual (RF-39). */
export class PagoRechazado extends ErrorDeDominio {
  constructor(motivo) {
    super("El pago fue rechazado. Su carrito sigue igual; puede intentar con otro medio de pago.", {
      codigo: "PAGO_RECHAZADO",
      detalles: { motivo },
    });
  }
}
