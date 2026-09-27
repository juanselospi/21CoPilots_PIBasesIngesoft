-- =====================================================================
-- 008 — Módulo reportes: vistas de solo lectura
--
-- Las vistas reúnen datos de varios módulos para los reportes (EP-06).
-- No calculan precios de venta: eso lo hace el motor de precios del dominio
-- (DD-13). El rango de fechas (RF-47) se aplica con WHERE sobre la fecha.
-- =====================================================================

-- RF-44: base del reporte de ventas por producto y por familia, de todos
-- los canales (RN-05). Un pedido cancelado no cuenta como venta.
-- monto es sin impuesto.
CREATE VIEW reportes.v_venta_por_linea AS
SELECT pe.id                           AS pedido_id,
       pe.colocado_en,
       pe.canal,
       pe.cliente_id,
       p.id                            AS producto_id,
       p.sku,
       p.nombre                        AS producto,
       c.id                            AS categoria_id,
       c.nombre                        AS categoria,
       s.id                            AS subcategoria_id,
       s.nombre                        AS subcategoria,
       lp.cantidad,
       lp.precio_unitario,
       lp.cantidad * lp.precio_unitario AS monto
FROM   pedidos.linea_pedido lp
JOIN   pedidos.pedido        pe ON pe.id = lp.pedido_id
JOIN   catalogo.producto     p  ON p.id  = lp.producto_id
JOIN   catalogo.subcategoria s  ON s.id  = p.subcategoria_id
JOIN   catalogo.categoria    c  ON c.id  = s.categoria_id
WHERE  pe.estado <> 'cancelado';

-- RF-45: existencias vigentes con las entradas del precio. El servicio de
-- reportes calcula el precio de venta con el motor de precios.
CREATE VIEW reportes.v_existencias AS
SELECT p.id                     AS producto_id,
       p.sku,
       p.nombre,
       p.estado,
       c.nombre                 AS categoria,
       s.nombre                 AS subcategoria,
       coalesce(e.cantidad, 0)  AS existencias,
       p.costo_item,
       p.porcentaje_importacion,
       p.margen_ganancia,
       p.admite_contrapedido
FROM   catalogo.producto        p
JOIN   catalogo.subcategoria    s ON s.id = p.subcategoria_id
JOIN   catalogo.categoria       c ON c.id = s.categoria_id
LEFT   JOIN inventario.existencia e ON e.producto_id = p.id;

-- RF-46: pedidos de cada cliente con fecha, monto y estado
CREATE VIEW reportes.v_pedidos_por_cliente AS
SELECT cl.id          AS cliente_id,
       cl.nombre      AS cliente,
       cl.cedula,
       pe.id          AS pedido_id,
       pe.colocado_en,
       pe.canal,
       pe.total,
       pe.estado,
       pe.estado_pago
FROM   pedidos.pedido   pe
JOIN   clientes.cliente cl ON cl.id = pe.cliente_id;

-- RN-06, RF-14: histórico de costos de compra de cada producto
CREATE VIEW reportes.v_historico_costos AS
SELECT m.producto_id,
       p.sku,
       p.nombre,
       m.registrado_en,
       m.tipo,
       m.cantidad,
       m.costo_unitario
FROM   inventario.movimiento m
JOIN   catalogo.producto     p ON p.id = m.producto_id
WHERE  m.costo_unitario IS NOT NULL;
