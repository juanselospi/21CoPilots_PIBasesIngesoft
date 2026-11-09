// Escoge el adaptador de correo segun la configuracion, igual que la pasarela de pago

import { CorreoSimulado } from "./adaptadores/correo-simulado.js";
import { CorreoSmtp } from "./adaptadores/correo-smtp.js";

const DATOS_OBLIGATORIOS_DE_SMTP = [
  ["host", "SMTP_HOST"],
  ["usuario", "SMTP_USUARIO"],
  ["contrasena", "SMTP_CONTRASENA"],
];

const ADAPTADORES = {
  simulado: () => new CorreoSimulado(),
  smtp: ({ smtp }) => {
    // Mejor que el servidor no arranque a que los correos fallen callados
    const faltan = DATOS_OBLIGATORIOS_DE_SMTP.filter(([dato]) => !smtp[dato]).map(([, variable]) => variable);
    if (faltan.length > 0) {
      throw new Error(`Para mandar correos por SMTP faltan estas variables en .env: ${faltan.join(", ")}.`);
    }
    return new CorreoSmtp({ ...smtp, remitente: smtp.remitente || smtp.usuario });
  },
};

export function crearEnviadorDeCorreo(correo) {
  const construir = ADAPTADORES[correo.adaptador];
  if (!construir) {
    throw new Error(
      `Adaptador de correo desconocido: "${correo.adaptador}". Opciones: ${Object.keys(ADAPTADORES).join(", ")}.`
    );
  }
  return construir(correo);
}
