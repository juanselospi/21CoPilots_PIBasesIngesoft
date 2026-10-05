/**
 * Plantilla de importación (Template Method).
 * Define los pasos fijos de cualquier importación:
 *   parsear -> prepararContexto -> validarFila -> mapearFila -> guardarFila
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

    // importadas = productos nuevos y actualizadas = SKU que ya existían.
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

  // Datos que la validación necesita de todo el archivo
  prepararContexto(_filas) {
    return {};
  }

  // Devuelve las filas del archivo
  async parsear(_archivo) {
    throw new Error("Sin implementar: parsear()");
  }

  // Devuelve la lista de problemas de la fila
  validarFila(_fila, _contexto) {
    throw new Error("Sin implementar: validarFila()");
  }

  // Convierte la fila al objeto de producto
  mapearFila(_fila) {
    throw new Error("Sin implementar: mapearFila()");
  }

  // Si algo falla, no se guarda nada.
  async enTransaccion(_trabajo) {
    throw new Error("Sin implementar: enTransaccion()");
  }

  // Actualiza si el SKU ya existe, no duplica
  async guardarFila(_cliente, _producto) {
    throw new Error("Sin implementar: guardarFila()");
  }
}
