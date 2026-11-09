// Arma el correo con el enlace para crear una contraseña nueva

export function correoDeRecuperacion({ para, enlace, duracionMinutos }) {
  const asunto = "Crea una contraseña nueva para DC Hobbies";
  const vigencia = `El enlace sirve una sola vez y vence en ${duracionMinutos} minutos.`;
  const aviso = "Si no lo pediste, puedes ignorar este correo: tu contraseña no va a cambiar.";

  const texto = [
    "Recibimos una solicitud para cambiar la contraseña de tu cuenta en DC Hobbies.",
    "",
    "Abre este enlace para crear una contraseña nueva:",
    enlace,
    "",
    vigencia,
    aviso,
  ].join("\n");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1c2b36;max-width:480px;margin:0 auto">
  <h1 style="font-size:20px;color:#0b2b3f">Crea una contraseña nueva</h1>
  <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta en DC Hobbies.</p>
  <p style="margin:24px 0"><a href="${enlace}" style="background:#0a75ae;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Crear contraseña</a></p>
  <p>${vigencia}</p>
  <p style="color:#51606c;font-size:13px">${aviso}</p>
</div>`;

  return { para, asunto, texto, html };
}
