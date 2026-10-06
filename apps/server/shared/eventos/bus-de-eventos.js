/**
 * Bus de eventos en proceso (patrón Observer).
 *
 * Desacopla a quien produce un hecho de quien reacciona a él.
 *
 * Es deliberadamente en memoria, no un broker de mensajes.
 *
 * Un suscriptor que falla no puede tumbar la operación que publicó el
 * evento: los errores se capturan y se registran.
 */

export class BusDeEventos {
  #suscriptores = new Map();

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


  // Publica un evento y espera a todos los suscriptores
  async publicar(evento, datos) {
    const manejadores = this.#suscriptores.get(evento) ?? [];

    // Si uno falla no afeccta a los demas
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
