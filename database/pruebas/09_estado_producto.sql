-- Estado del producto y eliminación física (012, C-16)

SELECT pg_temp.producto_prueba('PRB-EST', 5);

SELECT pg_temp.debe_cumplirse('Un producto nuevo nace activo',
    (SELECT estado FROM catalogo.producto WHERE sku = 'PRB-EST') = 'activo');

SELECT pg_temp.debe_funcionar('Un producto se descontinúa (RF-18)',
    $$UPDATE catalogo.producto SET estado = 'descontinuado' WHERE sku = 'PRB-EST'$$);

SELECT pg_temp.debe_funcionar('Un producto descontinuado se reactiva',
    $$UPDATE catalogo.producto SET estado = 'activo' WHERE sku = 'PRB-EST'$$);

SELECT pg_temp.debe_fallar('Un estado desconocido se rechaza',
    $$UPDATE catalogo.producto SET estado = 'agotado' WHERE sku = 'PRB-EST'$$, '23514');

SELECT pg_temp.debe_funcionar('Un producto sin historial se borra físicamente',
    $$DELETE FROM catalogo.producto WHERE sku = 'PRB-EST'$$);

SELECT pg_temp.producto_prueba('PRB-MOV');

SELECT pg_temp.debe_funcionar('Se registra un movimiento de mercancía del producto',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('PRB-MOV', pg_temp.admin_prueba(), 3)$$);

SELECT pg_temp.debe_fallar('Un producto con movimientos de mercancía no se borra',
    $$DELETE FROM catalogo.producto WHERE sku = 'PRB-MOV'$$, '23503');

SELECT pg_temp.debe_funcionar('Se registra una venta (pedido con el producto PRB-AYU)',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_fallar('Un producto con ventas no se borra',
    $$DELETE FROM catalogo.producto WHERE sku = 'PRB-AYU'$$, '23503');
