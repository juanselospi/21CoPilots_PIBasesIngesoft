/**
 * Plantilla de importación (Template Method).
 *
 * Define los pasos fijos de cualquier importación:
 *   parsear -> prepararContexto -> validarFila -> mapearFila -> guardarFila
 *
 * Cada formato de archivo implementa los pasos en una subclase, por
 * ejemplo ImportacionDeExcel. El orden no cambia.
 *
 * Primero se valida el archivo completo y después se guarda. Así una fila
 * mala no detiene la importación (RF-58) y se pueden revisar cosas que
 * dependen de todo el archivo, como un código repetido.
 *
 * Las filas válidas se guardan todas en una sola transacción: si falla
 * la base de datos a medio camino, no queda el catálogo a medias.
 *
 * guardarFila no escribe SQL: le pide el guardado al módulo de catálogo,
 * que es el dueño de esas tablas.
 */

export class PlantillaDeImportacion {
  async importar(archivo) {
    const filas = await this.parsear(archivo);
    const contexto = this.prepararContexto(filas);

    const resultado = { leidas: filas.length, importadas: 0, actualizadas: 0, rechazadas: [] };
    const validas = [];

    for (const fila of filas) {
      const motivos = this.validarFila(fila, contexto);

      if (motivos.length > 0) {
        resultado.rechazadas.push({ linea: fila.linea, fila, motivos });
      } else {
        validas.push(fila);
      }
    }

    // importadas = productos nuevos; actualizadas = SKU que ya existían.
    // Reimportar la misma hoja debería dar solo actualizadas (RF-59).
    // Si la transacción falla, el error sube y no se devuelve ningún conteo.
    const conteo = await this.enTransaccion(async (cliente) => {
      const parcial = { importadas: 0, actualizadas: 0 };
      for (const fila of validas) {
        const { insertado } = await this.guardarFila(cliente, this.mapearFila(fila));
        if (insertado) parcial.importadas += 1;
        else parcial.actualizadas += 1;
      }
      return parcial;
    });

    return { ...resultado, ...conteo };
  }

  /** Datos que la validación necesita de todo el archivo. Opcional. */
  prepararContexto(_filas) {
    return {};
  }

  /**
   * Devuelve las filas del archivo. Cada una trae `linea`, el número de
   * fila en el archivo, para que el reporte le diga al usuario dónde
   * está el problema.
   */
  async parsear(_archivo) {
    throw new Error("Sin implementar: parsear()");
  }

  /** Devuelve la lista de problemas de la fila. Vacía si está bien. */
  validarFila(_fila, _contexto) {
    throw new Error("Sin implementar: validarFila()");
  }

  /** Convierte la fila al objeto de producto. */
  mapearFila(_fila) {
    throw new Error("Sin implementar: mapearFila()");
  }

  /**
   * Corre `trabajo(cliente)` dentro de una transacción y devuelve lo que
   * este devuelva. Si algo falla, no se guarda nada.
   */
  async enTransaccion(_trabajo) {
    throw new Error("Sin implementar: enTransaccion()");
  }

  /**
   * Tiene que actualizar si el SKU ya existe, no duplicar (RF-59).
   * Devuelve `{ insertado }` para saber si fue nuevo o actualizado.
   */
  async guardarFila(_cliente, _producto) {
    throw new Error("Sin implementar: guardarFila()");
  }
}
