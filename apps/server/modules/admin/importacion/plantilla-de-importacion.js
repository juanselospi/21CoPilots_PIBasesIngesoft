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
 * guardarFila no escribe SQL: le pide el guardado al módulo de catálogo,
 * que es el dueño de esas tablas.
 */

export class PlantillaDeImportacion {
  async importar(archivo) {
    const filas = await this.parsear(archivo);
    const contexto = this.prepararContexto(filas);

    const resultado = { leidas: filas.length, importadas: 0, rechazadas: [] };
    const validas = [];

    for (const fila of filas) {
      const motivos = this.validarFila(fila, contexto);

      if (motivos.length > 0) {
        resultado.rechazadas.push({ linea: fila.linea, fila, motivos });
      } else {
        validas.push(fila);
      }
    }

    // TODO SCRUM-35: guardar todas las válidas en una sola transacción.
    for (const fila of validas) {
      await this.guardarFila(this.mapearFila(fila));
      resultado.importadas += 1;
    }

    return resultado;
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

  /** Tiene que actualizar si el SKU ya existe, no duplicar (RF-59). */
  async guardarFila(_producto) {
    throw new Error("Sin implementar: guardarFila()");
  }
}
