/**
 * Suscriptor de la bitácora (RF-52, RNF-10).
 *
 * Escucha los eventos que importan para auditar y los guarda en
 * admin.bitacora con quién, sobre qué, y el valor anterior y el nuevo.
 * Quien publica no sabe que existe; si guardar falla, el bus lo registra
 * en el log y la operación que publicó sigue igual.
 *
 * La tabla exige el correo de quien hizo la acción (C-20), así que un
 * evento sin usuario no se guarda.
 */

import { EVENTOS } from "../eventos/eventos-de-dominio.js";

export const EVENTOS_DE_LA_BITACORA = Object.freeze([
  EVENTOS.ACCESO_DENEGADO,
  EVENTOS.PARAMETRO_MODIFICADO,
  EVENTOS.ESTADO_DE_PRODUCTO_CAMBIADO,
  EVENTOS.PRODUCTO_ELIMINADO,
  EVENTOS.MOVIMIENTO_REGISTRADO,
  EVENTOS.EXISTENCIAS_BAJAS,
  EVENTOS.PEDIDO_CONFIRMADO,
  EVENTOS.PEDIDO_CANCELADO,
  EVENTOS.ESTADO_DE_PEDIDO_CAMBIADO,
  EVENTOS.PEDIDO_MODIFICADO,
  EVENTOS.PEDIDO_CREADO_MANUAL,
  EVENTOS.EMPLEADO_CREADO,
  EVENTOS.ESTADO_DE_EMPLEADO_CAMBIADO,
]);

/**
 * @param guardar recibe { correoUsuario, evento, entidad, entidadId, valorAnterior, valorNuevo }
 * @returns una función que quita todas las suscripciones
 */
export function registrarSuscriptorDeBitacora(busDeEventos, { guardar }) {
  const quitar = EVENTOS_DE_LA_BITACORA.map((evento) =>
    busDeEventos.suscribir(evento, async (datos) => {
      const registro = aRegistro(evento, datos);
      if (registro) await guardar(registro);
    })
  );
  return () => quitar.forEach((quitarUna) => quitarUna());
}

/**
 * Los eventos de cambios ya traen entidad y valores; los demás (como la
 * alerta de existencias) se guardan con lo que traen como valor nuevo.
 */
export function aRegistro(evento, datos = {}) {
  const { correoUsuario, entidad, entidadId, valorAnterior, valorNuevo, ...resto } = datos;
  if (!correoUsuario) return null;

  const traeValores = valorAnterior !== undefined || valorNuevo !== undefined;
  return {
    correoUsuario,
    evento,
    entidad: entidad ?? (resto.sku ? "producto" : null),
    entidadId: entidadId ?? resto.sku ?? null,
    valorAnterior: valorAnterior ?? null,
    valorNuevo: traeValores ? (valorNuevo ?? null) : sinVacios(resto),
  };
}

const sinVacios = (objeto) => (Object.keys(objeto).length > 0 ? objeto : null);
