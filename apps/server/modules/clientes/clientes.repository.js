/**
 * CAPA DE PERSISTENCIA —> Repositorio de clientes.
 *
 * El cliente se identifica por `correo_usuario`, el mismo correo de su
 * cuenta en `usuarios.usuario`. La cédula se guarda solo con dígitos.
 *
 * POR IMPLEMENTAR
 *   obtenerPorCorreo()             RF-37
 *   incrementarCompras()           RF-34 — `num_compras` es el insumo del nivel (RN-08)
 *   actualizarDatosFiscales()      aprobado #3 — cédula para la factura (RN-18)
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

// Restricciones únicas que se pueden disparar si dos registros se cruzan
const CAMPO_POR_RESTRICCION = Object.freeze({
  usuario_pkey: "correo",
  cliente_pkey: "correo",
  ux_cliente_cedula: "cedula",
});

export class ClientesRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /**
   * RF-32, RF-33, RF-38: crea el usuario, el cliente con la fecha en que
   * aceptó los términos y su teléfono, todo o nada.
   * @returns los campos que ya estaban registrados, o [] si se creó
   */
  async registrar({ nombre, correo, contrasenaHash, cedula, telefono, direccion }) {
    try {
      return await enTransaccion(this.#pool, async (cliente) => {
        const repetidos = await camposRepetidos(cliente, { correo, cedula });
        if (repetidos.length > 0) return repetidos;

        await cliente.query(
          `INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES ($1, $2, $3)`,
          [correo, contrasenaHash, nombre]
        );
        await cliente.query(
          `INSERT INTO clientes.cliente (correo_usuario, cedula, direccion, fecha_aceptacion_terminos)
           VALUES ($1, $2, $3, now())`,
          [correo, cedula, direccion]
        );
        await cliente.query(
          `INSERT INTO clientes.cliente_telefono (correo_usuario, telefono) VALUES ($1, $2)`,
          [correo, telefono]
        );
        return [];
      });
    } catch (error) {
      // Dos registros con el mismo dato al mismo tiempo: el segundo choca aquí
      const campo = error.code === "23505" && CAMPO_POR_RESTRICCION[error.constraint];
      if (campo) return [campo];
      throw error;
    }
  }
}

// La cédula de la semilla trae guiones, por eso se compara solo con los dígitos
async function camposRepetidos(cliente, { correo, cedula }) {
  const { rows } = await cliente.query(
    `SELECT EXISTS (SELECT 1 FROM usuarios.usuario WHERE correo = $1) AS correo,
            EXISTS (SELECT 1 FROM clientes.cliente
                     WHERE regexp_replace(cedula, '\\D', '', 'g') = $2) AS cedula`,
    [correo, cedula]
  );
  return ["correo", "cedula"].filter((campo) => rows[0][campo]);
}
