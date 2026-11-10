/**
 * Cuenta los intentos fallidos de inicio de sesión por correo y bloquea el
 * correo un rato cuando son demasiados, para frenar a quien prueba
 * contraseñas.
 *
 * Vive en memoria: al reiniciar el servidor se empieza de cero, lo cual está
 * bien para frenar intentos seguidos. Cuenta también los correos que no
 * tienen cuenta, así la respuesta no dice cuáles existen.
 */

const MINUTO = 60 * 1000;

export function crearLimiteDeIntentos({ maximo = 5, ventanaMinutos = 15, bloqueoMinutos = 10, ahora = Date.now } = {}) {
  // correo -> { fallos: [fechas en ms], bloqueadoHasta }
  const porCorreo = new Map();

  const vigentes = (fallos, momento) => fallos.filter((fecha) => momento - fecha < ventanaMinutos * MINUTO);

  // Quita lo que ya no cuenta para que el mapa no crezca sin límite
  const limpiar = (momento) => {
    for (const [correo, registro] of porCorreo) {
      if (registro.bloqueadoHasta <= momento && vigentes(registro.fallos, momento).length === 0) {
        porCorreo.delete(correo);
      }
    }
  };

  return {
    /** Segundos que faltan para poder intentar otra vez, o 0 si no está bloqueado. */
    segundosDeBloqueo(correo) {
      const restante = (porCorreo.get(correo)?.bloqueadoHasta ?? 0) - ahora();
      return restante > 0 ? Math.ceil(restante / 1000) : 0;
    },

    /** Anota un fallo y bloquea el correo si llegó al máximo. */
    registrarFallo(correo) {
      const momento = ahora();
      if (porCorreo.size > 1000) limpiar(momento);

      const registro = porCorreo.get(correo) ?? { fallos: [], bloqueadoHasta: 0 };
      registro.fallos = [...vigentes(registro.fallos, momento), momento];
      if (registro.fallos.length >= maximo) {
        registro.bloqueadoHasta = momento + bloqueoMinutos * MINUTO;
        registro.fallos = [];
      }
      porCorreo.set(correo, registro);
    },

    /** Al entrar bien, los fallos anteriores dejan de contar. */
    olvidar(correo) {
      porCorreo.delete(correo);
    },
  };
}
