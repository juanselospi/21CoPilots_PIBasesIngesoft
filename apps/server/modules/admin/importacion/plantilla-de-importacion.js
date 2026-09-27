/**
 * PLANTILLA DE IMPORTACIÓN — Template Method (§ 6.6).
 *
 * Define el esqueleto invariante del proceso de importación y deja
 * redefinibles los pasos que dependen del formato del archivo:
 *
 *     parsear → validarFila → mapearFila → guardarFila
 *
 * El algoritmo fija tres requerimientos que ninguna subclase puede
 * alterar:
 *   RF-58 — una fila inválida no detiene la importación; se acumula en el
 *           reporte de rechazos con su motivo
 *   RF-57 — al terminar se informa cuántas filas se importaron
 *   RF-59 — `guardarFila` debe ser idempotente por SKU: reimportar el
 *           mismo archivo actualiza, no duplica
 *
 * La subclase concreta (por ejemplo `ImportacionDeExcel`) implementa los
 * cuatro pasos abstractos. `guardarFila` no escribe SQL sobre
 * `catalogo.producto`: pide el upsert a la fachada de catalogo, que es la
 * dueña de ese esquema (§ 9.3). El SKU se normaliza antes (RF-01). SUP-01 advierte que aún no se han visto los
 * datos reales, así que el validador debe ser explícito sobre cada motivo
 * de rechazo.
 */

export class PlantillaDeImportacion {
  /** Método plantilla: su estructura no se redefine. */
  async importar(archivo) {
    const filas = await this.parsear(archivo);

    const resultado = { importadas: 0, rechazadas: [] };

    for (const [indice, fila] of filas.entries()) {
      const motivo = this.validarFila(fila);

      if (motivo) {
        resultado.rechazadas.push({ linea: indice + 1, fila, motivo });
        continue;
      }

      await this.guardarFila(this.mapearFila(fila));
      resultado.importadas += 1;
    }

    return resultado;
  }

  // ---- Pasos que la subclase debe implementar ----

  /** @returns {Promise<object[]>} filas crudas del archivo */
  async parsear(_archivo) {
    throw new Error("Sin implementar: parsear()");
  }

  /** @returns {string|null} motivo del rechazo, o null si la fila es válida */
  validarFila(_fila) {
    throw new Error("Sin implementar: validarFila()");
  }

  /** @returns {object} fila traducida al modelo de dominio */
  mapearFila(_fila) {
    throw new Error("Sin implementar: mapearFila()");
  }

  /** Debe ser idempotente por SKU (RF-59). */
  async guardarFila(_producto) {
    throw new Error("Sin implementar: guardarFila()");
  }
}
