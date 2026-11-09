import { EnviadorDeCorreo } from "../enviador-de-correo.port.js";

// Para desarrollar sin credenciales: el correo no sale, solo se escribe en el log
export class CorreoSimulado extends EnviadorDeCorreo {
  async enviar({ para, asunto, texto }) {
    console.info(`Correo simulado para ${para} (${asunto}):\n${texto}`);
  }
}
