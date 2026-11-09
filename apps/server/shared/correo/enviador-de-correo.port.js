// Interfaz para mandar correos, asi el resto del servidor no sabe con que se mandan.
// El mensaje es { para, asunto, texto, html }

export class EnviadorDeCorreo {
  async enviar(_mensaje) {
    throw new Error("Sin implementar: enviar()");
  }
}
