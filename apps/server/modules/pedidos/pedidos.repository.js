/**
 * CAPA DE PERSISTENCIA — Repositorio de carrito y pedidos.
 *
 * El pedido se identifica por `(correo_cliente, num_carrito)`. Las líneas
 * viven en `agrega` con el precio sin impuesto y la tasa del momento, y el
 * estado vigente se lee de `reportes.v_estado_pedido`, no de una columna.
 *
 * POR IMPLEMENTAR
 *   listarPorCliente()                  RF-29, RF-37
 */

import { enTransaccion } from "../../shared/db/unidad-de-trabajo.js";

export class PedidosRepository {
  #pool;

  constructor({ pool }) {
    this.#pool = pool;
  }

  /** Unit of Work: ejecuta el trabajo dentro de una sola transacción. */
  enTransaccion(trabajo) {
    return enTransaccion(this.#pool, trabajo);
  }

  /** Monto de cada modalidad de entrega. */
  async listarTarifas() {
    const { rows } = await this.#pool.query(`SELECT modalidad, monto FROM pedidos.tarifa_envio`);
    return rows.map((fila) => ({ modalidad: fila.modalidad, monto: Number(fila.monto) }));
  }

  /** El carrito activo del cliente con sus líneas, o null si no tiene. */
  async obtenerCarritoActivo(correo) {
    const { rows } = await this.#pool.query(
      `SELECT c.num_carrito, a.sku, a.cantidad_solicitada, a.precio_unitario, a.tasa_impuesto_aplicada
         FROM pedidos.carrito c
         LEFT JOIN pedidos.agrega a
                ON a.correo_cliente = c.correo_cliente AND a.num_carrito = c.num_carrito
        WHERE c.correo_cliente = $1
          AND c.estado_carrito = 'activo'
        ORDER BY a.sku`,
      [correo]
    );
    if (rows.length === 0) return null;

    return {
      numCarrito: rows[0].num_carrito,
      lineas: rows
        .filter((fila) => fila.sku !== null)
        .map((fila) => ({
          sku: fila.sku,
          cantidad: fila.cantidad_solicitada,
          precioUnitario: Number(fila.precio_unitario),
          tasaImpuesto: Number(fila.tasa_impuesto_aplicada),
        })),
    };
  }

  /**
   * Crea el carrito activo con el número siguiente. Si dos peticiones lo
   * intentan a la vez, el índice de un solo carrito activo deja pasar una y
   * las dos se quedan con ese.
   * @returns el número del carrito activo
   */
  async abrirCarrito(correo) {
    await this.#pool.query(
      `INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
       SELECT $1::varchar, coalesce(max(num_carrito), 0) + 1 FROM pedidos.carrito WHERE correo_cliente = $1::varchar
       ON CONFLICT DO NOTHING`,
      [correo]
    );
    const { rows } = await this.#pool.query(
      `SELECT num_carrito FROM pedidos.carrito WHERE correo_cliente = $1 AND estado_carrito = 'activo'`,
      [correo]
    );
    return rows[0].num_carrito;
  }

  /** Crea la línea o le cambia la cantidad y el precio. Sirve para el carrito y para editar un pedido. */
  async guardarLinea(correo, numCarrito, { sku, cantidad, precioUnitario, tasaImpuesto }, cliente = this.#pool) {
    await cliente.query(
      `INSERT INTO pedidos.agrega
              (correo_cliente, num_carrito, sku, cantidad_solicitada, precio_unitario, tasa_impuesto_aplicada)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (correo_cliente, num_carrito, sku) DO UPDATE SET
              cantidad_solicitada    = EXCLUDED.cantidad_solicitada,
              precio_unitario        = EXCLUDED.precio_unitario,
              tasa_impuesto_aplicada = EXCLUDED.tasa_impuesto_aplicada`,
      [correo, numCarrito, sku, cantidad, precioUnitario, tasaImpuesto]
    );
  }

  async quitarLinea(correo, numCarrito, sku, cliente = this.#pool) {
    await cliente.query(
      `DELETE FROM pedidos.agrega WHERE correo_cliente = $1 AND num_carrito = $2 AND sku = $3`,
      [correo, numCarrito, sku]
    );
  }

  // Lo que sigue corre dentro de la transacción de confirmar el pedido

  /**
   * Bloquea el carrito activo para que dos confirmaciones del mismo cliente
   * no lo conviertan dos veces.
   * @returns el carrito con sus líneas, o null si no tiene
   */
  async bloquearCarritoActivo(cliente, correo) {
    const { rows } = await cliente.query(
      `SELECT num_carrito FROM pedidos.carrito
        WHERE correo_cliente = $1 AND estado_carrito = 'activo'
          FOR UPDATE`,
      [correo]
    );
    if (!rows[0]) return null;

    const numCarrito = rows[0].num_carrito;
    const { rows: lineas } = await cliente.query(
      `SELECT sku, cantidad_solicitada FROM pedidos.agrega
        WHERE correo_cliente = $1 AND num_carrito = $2
        ORDER BY sku`,
      [correo, numCarrito]
    );
    return { numCarrito, lineas: lineas.map((fila) => ({ sku: fila.sku, cantidad: fila.cantidad_solicitada })) };
  }

  /** Desde aquí el precio no cambia: el pedido respeta el precio pagado. */
  async congelarPrecio(cliente, correo, numCarrito, { sku, precioUnitario, tasaImpuesto }) {
    await cliente.query(
      `UPDATE pedidos.agrega SET precio_unitario = $4, tasa_impuesto_aplicada = $5
        WHERE correo_cliente = $1 AND num_carrito = $2 AND sku = $3`,
      [correo, numCarrito, sku, precioUnitario, tasaImpuesto]
    );
  }

  /** RF-25: el carrito pasa a convertido y nace el pedido con su primer estado, colocado. */
  async crearPedido(cliente, { correo, numCarrito, modalidadEntrega, direccion, costoEntrega, canal = "web" }) {
    await cliente.query(
      `UPDATE pedidos.carrito SET estado_carrito = 'convertido', fecha_cierre = now()
        WHERE correo_cliente = $1 AND num_carrito = $2`,
      [correo, numCarrito]
    );
    const { rows } = await cliente.query(
      `INSERT INTO pedidos.pedido (correo_cliente, num_carrito, modalidad_entrega, direccion, costo_entrega, canal)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING fecha_pedido_realizado`,
      [correo, numCarrito, modalidadEntrega, direccion, costoEntrega, canal]
    );
    await this.registrarEstado(cliente, correo, numCarrito, "colocado");
    return rows[0].fecha_pedido_realizado;
  }

  /**
   * Bloquea el pedido para que dos cambios a la vez no lean el mismo estado.
   * @returns el canal del pedido, o null si no existe
   */
  async bloquearPedido(cliente, correo, numCarrito) {
    const { rows } = await cliente.query(
      `SELECT canal FROM pedidos.pedido WHERE correo_cliente = $1 AND num_carrito = $2 FOR UPDATE`,
      [correo, numCarrito]
    );
    return rows[0] ? { canal: rows[0].canal } : null;
  }

  async registrarEstado(cliente, correo, numCarrito, estado) {
    await cliente.query(
      `INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado) VALUES ($1, $2, $3)`,
      [correo, numCarrito, estado]
    );
  }

  async existePedido(correo, numCarrito) {
    const { rows } = await this.#pool.query(
      `SELECT 1 FROM pedidos.pedido WHERE correo_cliente = $1 AND num_carrito = $2`,
      [correo, numCarrito]
    );
    return rows.length > 0;
  }

  /** Las líneas del pedido con el precio que quedó congelado al confirmar. */
  async lineasDelPedido(correo, numCarrito, cliente = this.#pool) {
    const { rows } = await cliente.query(
      `SELECT sku, cantidad_solicitada, precio_unitario, tasa_impuesto_aplicada
         FROM pedidos.agrega
        WHERE correo_cliente = $1 AND num_carrito = $2
        ORDER BY sku`,
      [correo, numCarrito]
    );
    return rows.map((fila) => ({
      sku: fila.sku,
      cantidad: fila.cantidad_solicitada,
      precioUnitario: Number(fila.precio_unitario),
      tasaImpuesto: Number(fila.tasa_impuesto_aplicada),
    }));
  }

  async costoDeEntrega(correo, numCarrito) {
    const { rows } = await this.#pool.query(
      `SELECT costo_entrega FROM pedidos.pedido WHERE correo_cliente = $1 AND num_carrito = $2`,
      [correo, numCarrito]
    );
    return rows[0] ? Number(rows[0].costo_entrega) : null;
  }

  // Lo que sigue es para el panel del administrador

  /**
   * RF-46: los pedidos con su estado vigente y un resumen de productos, del
   * más nuevo al más viejo. `q` busca en el cliente, el destinatario y los
   * productos.
   */
  async listarParaAdministracion({ estado, canal, correo, q, desde, hasta, limite, pagina }) {
    const { rows } = await this.#pool.query(
      `SELECT v.correo_cliente, v.cliente, v.cedula, v.num_carrito, v.fecha_pedido_realizado,
              v.modalidad_entrega, v.subtotal, v.impuesto, v.costo_entrega, v.estado,
              p.canal, p.creado_por, p.nombre_destinatario,
              productos.lineas, productos.unidades,
              count(*) OVER () AS total
         FROM reportes.v_pedidos_por_cliente v
         JOIN pedidos.pedido p
           ON p.correo_cliente = v.correo_cliente AND p.num_carrito = v.num_carrito
        CROSS JOIN LATERAL (
              SELECT coalesce(json_agg(json_build_object('sku', a.sku, 'nombre', pr.nombre, 'cantidad', a.cantidad_solicitada)
                                       ORDER BY pr.nombre), '[]') AS lineas,
                     coalesce(sum(a.cantidad_solicitada), 0) AS unidades
                FROM pedidos.agrega a
                JOIN catalogo.producto pr ON pr.sku = a.sku
               WHERE a.correo_cliente = v.correo_cliente AND a.num_carrito = v.num_carrito
             ) productos
        WHERE ($1::text IS NULL OR v.estado = $1)
          AND ($2::text IS NULL OR p.canal = $2)
          AND ($3::text IS NULL OR v.correo_cliente = $3)
          AND ($4::timestamptz IS NULL OR v.fecha_pedido_realizado >= $4)
          AND ($5::timestamptz IS NULL OR v.fecha_pedido_realizado < $5)
          AND ($6::text IS NULL
               OR v.cliente ILIKE '%' || $6 || '%'
               OR v.correo_cliente ILIKE '%' || $6 || '%'
               OR v.cedula ILIKE '%' || $6 || '%'
               OR p.nombre_destinatario ILIKE '%' || $6 || '%'
               OR EXISTS (SELECT 1
                            FROM pedidos.agrega a
                            JOIN catalogo.producto pr ON pr.sku = a.sku
                           WHERE a.correo_cliente = v.correo_cliente AND a.num_carrito = v.num_carrito
                             AND (pr.nombre ILIKE '%' || $6 || '%' OR a.sku ILIKE '%' || $6 || '%')))
        ORDER BY v.fecha_pedido_realizado DESC, v.correo_cliente, v.num_carrito DESC
        LIMIT $7 OFFSET $8`,
      [estado, canal, correo, desde, hasta, q, limite, pagina * limite]
    );

    return {
      pedidos: rows.map((fila) => ({
        ...pedidoDeLaVista(fila),
        productos: fila.lineas,
        unidades: Number(fila.unidades),
      })),
      total: Number(rows[0]?.total ?? 0),
    };
  }

  /** El pedido con los datos que solo ve el administrador, o null si no existe. */
  async obtenerParaAdministracion(correo, numCarrito) {
    const { rows } = await this.#pool.query(
      `SELECT v.correo_cliente, v.cliente, v.cedula, v.num_carrito, v.fecha_pedido_realizado,
              v.modalidad_entrega, v.subtotal, v.impuesto, v.costo_entrega, v.estado,
              p.canal, p.creado_por, p.nombre_destinatario, p.direccion, p.fecha_entrega,
              u.nombre AS nombre_creado_por
         FROM reportes.v_pedidos_por_cliente v
         JOIN pedidos.pedido p
           ON p.correo_cliente = v.correo_cliente AND p.num_carrito = v.num_carrito
         LEFT JOIN usuarios.usuario u ON u.correo = p.creado_por
        WHERE v.correo_cliente = $1 AND v.num_carrito = $2`,
      [correo, numCarrito]
    );
    const fila = rows[0];
    if (!fila) return null;

    return {
      ...pedidoDeLaVista(fila),
      direccion: fila.direccion,
      fechaEntrega: fila.fecha_entrega,
      nombreCreadoPor: fila.nombre_creado_por,
    };
  }

  /** Cada estado por el que pasó el pedido, del primero al vigente. */
  async historialDeEstados(correo, numCarrito, cliente = this.#pool) {
    const { rows } = await cliente.query(
      `SELECT estado, fecha FROM pedidos.historial_estado
        WHERE correo_cliente = $1 AND num_carrito = $2
        ORDER BY fecha`,
      [correo, numCarrito]
    );
    return rows.map((fila) => ({ estado: fila.estado, fecha: fila.fecha }));
  }
}

function pedidoDeLaVista(fila) {
  return {
    correoCliente: fila.correo_cliente,
    nombreCliente: fila.cliente,
    cedula: fila.cedula,
    numCarrito: fila.num_carrito,
    fecha: fila.fecha_pedido_realizado,
    estado: fila.estado,
    canal: fila.canal,
    creadoPor: fila.creado_por,
    nombreDestinatario: fila.nombre_destinatario,
    modalidadEntrega: fila.modalidad_entrega,
    subtotal: Number(fila.subtotal),
    impuesto: Number(fila.impuesto),
    costoEntrega: Number(fila.costo_entrega),
  };
}
