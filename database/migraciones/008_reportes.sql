-- =====================================================================
-- 008 — Módulo reportes: vistas de solo lectura
--
-- Reúnen datos de varios módulos para los reportes (EP-06) y exponen los
-- atributos derivados del EER que no se guardan (estado del pedido y montos
-- de la factura). No calculan precios de venta de productos: eso lo hace el
-- motor de precios del dominio (DD-13). El rango de fechas (RF-47) se aplica
-- con WHERE sobre la fecha.
-- =====================================================================

-- Atributo derivado "Estado pedido": el del último cambio del historial
CREATE VIEW reportes.v_estado_pedido AS
SELECT DISTINCT ON (h.correo_cliente, h.num_carrito)
       h.correo_cliente,
       h.num_carrito,
       h.estado,
       h.fecha AS fecha_estado
FROM   pedidos.historial_estado h
ORDER  BY h.correo_cliente, h.num_carrito, h.numero_cambio DESC;

-- RF-44: ventas por producto y por categoría, de las líneas de los carritos
-- que se convirtieron en pedido. Un pedido cancelado no cuenta como venta.
-- monto es sin impuesto.
CREATE VIEW reportes.v_venta_por_producto AS
SELECT pe.correo_cliente,
       pe.num_carrito,
       pe.fecha_pedido_realizado,
       p.sku,
       p.nombre                                     AS producto,
       p.categoria,
       a.cantidad_solicitada                        AS cantidad,
       a.precio_unitario,
       a.tasa_impuesto_aplicada,
       a.cantidad_solicitada * a.precio_unitario    AS monto
FROM   pedidos.pedido  pe
JOIN   pedidos.agrega  a  ON a.correo_cliente = pe.correo_cliente
                         AND a.num_carrito    = pe.num_carrito
JOIN   catalogo.producto p ON p.sku = a.sku
LEFT   JOIN reportes.v_estado_pedido ep ON ep.correo_cliente = pe.correo_cliente
                                       AND ep.num_carrito    = pe.num_carrito
WHERE  ep.estado IS DISTINCT FROM 'cancelado';

-- RF-45: existencias vigentes con las entradas del precio. El servicio de
-- reportes calcula el precio de venta con el motor de precios.
CREATE VIEW reportes.v_existencias AS
SELECT sku,
       nombre,
       categoria,
       stock,
       item,
       importacion,
       costo_total,
       margen_ganancia,
       tasa_impuesto,
       contrapedido
FROM   catalogo.producto;

-- RF-46: pedidos de cada cliente con fecha, montos y estado. Subtotal e
-- impuesto son los atributos derivados de la factura, calculados de las
-- líneas del pedido. El descuento de la oferta lo calcula el dominio.
CREATE VIEW reportes.v_pedidos_por_cliente AS
SELECT pe.correo_cliente,
       u.nombre                AS cliente,
       cl.cedula,
       pe.num_carrito,
       pe.fecha_pedido_realizado,
       pe.fecha_entrega,
       pe.modalidad_entrega,
       pe.codigo_oferta,
       lineas.subtotal,
       lineas.impuesto,
       pe.costo_entrega,
       ep.estado
FROM   pedidos.pedido   pe
JOIN   clientes.cliente cl ON cl.correo_usuario = pe.correo_cliente
JOIN   admin.usuario    u  ON u.correo          = pe.correo_cliente
JOIN   LATERAL (
       SELECT coalesce(sum(a.cantidad_solicitada * a.precio_unitario), 0) AS subtotal,
              coalesce(sum(a.cantidad_solicitada * a.precio_unitario
                           * a.tasa_impuesto_aplicada / 100), 0)          AS impuesto
       FROM   pedidos.agrega a
       WHERE  a.correo_cliente = pe.correo_cliente
         AND  a.num_carrito    = pe.num_carrito
       ) lineas ON TRUE
LEFT   JOIN reportes.v_estado_pedido ep ON ep.correo_cliente = pe.correo_cliente
                                       AND ep.num_carrito    = pe.num_carrito;

-- RF-13, RF-19: registro de mercancía de cada producto
CREATE VIEW reportes.v_registro_mercancia AS
SELECT pa.sku,
       p.nombre,
       pa.fecha,
       pa.cantidad,
       pa.correo_administrador
FROM   inventario.producto_administra pa
JOIN   catalogo.producto              p ON p.sku = pa.sku;
