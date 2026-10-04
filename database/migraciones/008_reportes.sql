-- 008: crea vistas de solo lectura para reportes.

-- Muestra el estado más reciente de cada pedido.
CREATE VIEW reportes.v_estado_pedido AS
SELECT DISTINCT ON (h.correo_cliente, h.num_carrito)
       h.correo_cliente,
       h.num_carrito,
       h.estado,
       h.fecha AS fecha_estado
FROM   pedidos.historial_estado h
ORDER  BY h.correo_cliente, h.num_carrito, h.numero_cambio DESC;

-- Muestra las ventas por producto.
-- Los pedidos cancelados no se toman en cuenta.
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
JOIN   pedidos.agrega  a  
       ON a.correo_cliente = pe.correo_cliente
       AND a.num_carrito    = pe.num_carrito

JOIN   catalogo.producto p 
       ON p.sku = a.sku

LEFT   JOIN reportes.v_estado_pedido ep 
       ON ep.correo_cliente = pe.correo_cliente
       AND ep.num_carrito    = pe.num_carrito
       WHERE  ep.estado IS DISTINCT FROM 'cancelado';

-- Muestra las existencias actuales de cada producto
-- junto con los datos necesarios para calcular su precio.
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

-- Muestra los pedidos realizados por cada cliente.
-- El subtotal y el impuesto se calculan a partir de los productos del pedido.
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
JOIN   clientes.cliente cl 
       ON cl.correo_usuario = pe.correo_cliente
JOIN   admin.usuario    u  
       ON u.correo          = pe.correo_cliente
JOIN   LATERAL 
       (
              SELECT coalesce(sum(a.cantidad_solicitada * a.precio_unitario), 0) AS subtotal,
                     coalesce(sum(a.cantidad_solicitada * a.precio_unitario * a.tasa_impuesto_aplicada / 100), 0) AS impuesto
              FROM   pedidos.agrega a
              WHERE  a.correo_cliente = pe.correo_cliente
              AND  a.num_carrito    = pe.num_carrito
       ) lineas ON TRUE

LEFT   JOIN reportes.v_estado_pedido ep 
       ON ep.correo_cliente = pe.correo_cliente
       AND ep.num_carrito    = pe.num_carrito;

-- Muestra el historial de movimientos de inventario por producto.
CREATE VIEW reportes.v_registro_mercancia AS
SELECT pa.sku,
       p.nombre,
       pa.fecha,
       pa.cantidad,
       pa.correo_administrador
FROM   inventario.producto_administra pa
JOIN   catalogo.producto  p 
       ON p.sku = pa.sku;