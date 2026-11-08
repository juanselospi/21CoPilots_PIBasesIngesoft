/**
 * CAPA DE PERSISTENCIA —> Repositorio de clientes.
 *
 * El cliente se identifica por `correo_usuario`, el mismo correo de su
 * cuenta en `usuarios.usuario`. La cédula se guarda solo con dígitos.
 *
 * POR IMPLEMENTAR
 *   actualizarDatosFiscales()      aprobado #3 — corregir la cédula (solo administrador)
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";
import { CORREO_DE_VENTA_SIN_CUENTA } from "../../shared/cuentas/venta-sin-cuenta.js";

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

  /** RN-18: el nombre y la cédula que van como receptor en la factura. */
  async datosFiscales(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.nombre, c.cedula
         FROM clientes.cliente c
         JOIN usuarios.usuario u ON u.correo = c.correo_usuario
        WHERE c.correo_usuario = $1`,
      [correo]
    );
    return rows[0] ?? null;
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

  /** RF-37: los datos del cliente con sus teléfonos, o null si el correo no es de un cliente. */
  /** La cédula se compara solo por sus dígitos: se escriba o esté guardada con guiones o sin ellos. */
  async buscarClientes(termino, limite) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, c.cedula
         FROM clientes.cliente c
         JOIN usuarios.usuario u ON u.correo = c.correo_usuario
        WHERE c.correo_usuario <> $3
          AND (u.nombre ILIKE '%' || $1 || '%'
               OR u.correo ILIKE '%' || $1 || '%'
               OR ($2 <> '' AND regexp_replace(c.cedula, '\\D', '', 'g') LIKE '%' || $2 || '%'))
        ORDER BY u.nombre, u.correo
        LIMIT $4`,
      [termino, termino.replace(/\D/g, ""), CORREO_DE_VENTA_SIN_CUENTA, limite]
    );
    return rows;
  }

  async obtenerPorCorreo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT u.correo, u.nombre, c.cedula, c.direccion, c.num_compras, c.fecha_aceptacion_terminos,
              coalesce(array_agg(t.telefono ORDER BY t.telefono) FILTER (WHERE t.telefono IS NOT NULL), '{}') AS telefonos
         FROM clientes.cliente c
         JOIN usuarios.usuario u ON u.correo = c.correo_usuario
         LEFT JOIN clientes.cliente_telefono t ON t.correo_usuario = c.correo_usuario
        WHERE c.correo_usuario = $1
        GROUP BY u.correo, u.nombre, c.cedula, c.direccion, c.num_compras, c.fecha_aceptacion_terminos`,
      [correo]
    );
    if (!rows[0]) return null;

    const fila = rows[0];
    return {
      correo: fila.correo,
      nombre: fila.nombre,
      cedula: fila.cedula,
      direccion: fila.direccion,
      telefonos: fila.telefonos,
      numeroDeCompras: fila.num_compras,
      fechaAceptacionTerminos: fila.fecha_aceptacion_terminos,
    };
  }

  /** Cambia la dirección y reemplaza los teléfonos, lo que venga, en una transacción. */
  async actualizarContacto(correo, { direccion, telefonos }) {
    await enTransaccion(this.#pool, async (cliente) => {
      if (direccion !== undefined) {
        await cliente.query(`UPDATE clientes.cliente SET direccion = $2 WHERE correo_usuario = $1`, [correo, direccion]);
      }
      if (telefonos !== undefined) {
        await cliente.query(`DELETE FROM clientes.cliente_telefono WHERE correo_usuario = $1`, [correo]);
        await cliente.query(
          `INSERT INTO clientes.cliente_telefono (correo_usuario, telefono)
           SELECT $1, unnest($2::text[])`,
          [correo, telefonos]
        );
      }
    });
  }

  /** Un crédito a favor por algo que se quitó de un pedido pagado. */
  async registrarCredito(cliente, { correo, numCarrito, monto, motivo }) {
    await cliente.query(
      `INSERT INTO clientes.credito (correo_cliente, monto, motivo, num_carrito_pedido) VALUES ($1, $2, $3, $4)`,
      [correo, monto, motivo, numCarrito]
    );
  }

  async creditoOtorgadoPorPedido(correo, numCarrito, cliente = this.#pool) {
    const { rows } = await cliente.query(
      `SELECT coalesce(sum(monto), 0) AS monto
         FROM clientes.credito
        WHERE correo_cliente = $1 AND num_carrito_pedido = $2`,
      [correo, numCarrito]
    );
    return Number(rows[0].monto);
  }

  /** Lo otorgado, lo usado y el saldo; en 0 si nunca tuvo crédito. */
  async saldoDeCredito(correo) {
    const { rows } = await this.#pool.query(
      `SELECT otorgado, usado, saldo FROM reportes.v_saldo_credito WHERE correo_cliente = $1`,
      [correo]
    );
    const fila = rows[0] ?? { otorgado: 0, usado: 0, saldo: 0 };
    return { otorgado: Number(fila.otorgado), usado: Number(fila.usado), saldo: Number(fila.saldo) };
  }

  /**
   * El saldo con la fila del cliente bloqueada, igual que el trigger que lo
   * revisa al pagar, para que dos compras a la vez no gasten el mismo saldo.
   */
  async bloquearSaldoDeCredito(cliente, correo) {
    await cliente.query(`SELECT 1 FROM clientes.cliente WHERE correo_usuario = $1 FOR UPDATE`, [correo]);
    const { rows } = await cliente.query(`SELECT saldo FROM reportes.v_saldo_credito WHERE correo_cliente = $1`, [
      correo,
    ]);
    return Number(rows[0]?.saldo ?? 0);
  }

  /** Cada crédito otorgado y cada pago hecho con crédito, lo más nuevo primero. */
  async movimientosDeCredito(correo) {
    const { rows } = await this.#pool.query(
      `SELECT 'otorgado' AS tipo, fecha, monto, motivo, num_carrito_pedido AS num_carrito
         FROM clientes.credito
        WHERE correo_cliente = $1
       UNION ALL
       SELECT 'usado', fecha, monto, NULL, num_carrito
         FROM pagos.pago
        WHERE correo_cliente = $1 AND metodo_pago = 'credito' AND estado_pago <> 'rechazado'
        ORDER BY fecha DESC`,
      [correo]
    );
    return rows.map((fila) => ({
      tipo: fila.tipo,
      fecha: fila.fecha,
      monto: Number(fila.monto),
      motivo: fila.motivo,
      numCarrito: fila.num_carrito,
    }));
  }

  /** RF-34: una compra más; es el insumo del nivel de fidelidad (RN-08). */
  async incrementarCompras(cliente, correo) {
    await cliente.query(`UPDATE clientes.cliente SET num_compras = num_compras + 1 WHERE correo_usuario = $1`, [
      correo,
    ]);
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
