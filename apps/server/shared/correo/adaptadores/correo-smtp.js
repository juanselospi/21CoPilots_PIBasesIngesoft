import nodemailer from "nodemailer";
import { EnviadorDeCorreo } from "../enviador-de-correo.port.js";

// Manda el correo de verdad por SMTP. El puerto 465 va cifrado desde el inicio y los demas usan STARTTLS
export class CorreoSmtp extends EnviadorDeCorreo {
  #transporte;
  #remitente;

  constructor({ host, puerto, usuario, contrasena, remitente }, transporte = null) {
    super();
    this.#remitente = remitente;
    this.#transporte =
      transporte ??
      nodemailer.createTransport({
        host,
        port: puerto,
        secure: puerto === 465,
        auth: { user: usuario, pass: contrasena },
        // Sin esto un servidor de correo caido deja la conexion colgada
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });
  }

  async enviar({ para, asunto, texto, html }) {
    await this.#transporte.sendMail({ from: this.#remitente, to: para, subject: asunto, text: texto, html });
  }
}
