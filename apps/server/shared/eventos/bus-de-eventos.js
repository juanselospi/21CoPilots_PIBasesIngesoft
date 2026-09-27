/**
 * Bus de eventos en proceso (patrón Observer).
 *
 * Desacopla a quien produce un hecho de quien reacciona a él: el módulo
 * de inventario publica "se registró un movimiento" sin saber que la
 * alerta de existencias bajas (RF-16) y la bitácora de auditoría (RF-52)
 * están escuchando.
 *
 * Es deliberadamente en memoria, no un broker de mensajes: con un solo
 * proceso Node, una cola externa agregaría infraestructura, despliegue y
 * un punto de falla sin ganancia alguna. Si algún día el sistema se
 * distribuye, esta clase es la costura por donde se reemplaza.
 *
 * Un suscriptor que falla no puede tumbar la operación que publicó el
 * evento (RNF-06): los errores se capturan y se registran.
 */

export class BusDeEventos {
  /** @type {Map<string, Array<(datos: unknown) => unknown>>} */
  #suscriptores = new Map();

  /**
   * @param {string} evento nombre tomado de EVENTOS
   * @param {(datos: any) => unknown} manejador
   * @returns {() => void} función para cancelar la suscripción
   */
  suscribir(evento, manejador) {
    const manejadores = this.#suscriptores.get(evento) ?? [];
    manejadores.push(manejador);
    this.#suscriptores.set(evento, manejadores);

    return () => {
      const vigentes = this.#suscriptores.get(evento) ?? [];
      this.#suscriptores.set(
        evento,
        vigentes.filter((candidato) => candidato !== manejador)
      );
    };
  }

  /**
   * Publica un evento. Espera a todos los suscriptores, pero un fallo en
   * uno no interrumpe a los demás ni se propaga a quien publicó.
   */
  async publicar(evento, datos) {
    const manejadores = this.#suscriptores.get(evento) ?? [];

    // El manejador se envuelve en una función asíncrona a propósito: así
    // un suscriptor SÍNCRONO que lanza produce una promesa rechazada en
    // vez de romper el map() antes de que allSettled pueda atraparlo.
    const resultados = await Promise.allSettled(
      manejadores.map(async (manejador) => manejador(datos))
    );

    for (const resultado of resultados) {
      if (resultado.status === "rejected") {
        console.error(`Suscriptor de "${evento}" falló:`, resultado.reason);
      }
    }
  }
}
