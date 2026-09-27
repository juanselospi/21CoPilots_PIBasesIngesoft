-- Restricciones de carritos y pedidos (RN-14, RF-17, RF-25, RF-26)

SELECT pg_temp.producto_prueba('PRB-PED', 5);

SELECT pg_temp.debe_funcionar('Se crea un carrito activo (RN-14)',
    $$INSERT INTO pedidos.carrito (usuario_id) VALUES (pg_temp.usuario_cliente_prueba())$$);

SELECT pg_temp.debe_fallar('No puede haber dos carritos activos para la misma cuenta',
    $$INSERT INTO pedidos.carrito (usuario_id) VALUES (pg_temp.usuario_cliente_prueba())$$, '23505');

SELECT pg_temp.debe_fallar('Un carrito convertido debe tener fecha de cierre',
    $$UPDATE pedidos.carrito SET estado = 'convertido'
      WHERE usuario_id = pg_temp.usuario_cliente_prueba()$$, '23514');

SELECT pg_temp.debe_fallar('Un pedido en línea sin cliente se rechaza (RF-25)',
    $$INSERT INTO pedidos.pedido (canal, modalidad_entrega, subtotal, impuesto, total)
      VALUES ('en_linea', 'mensajero', 0, 0, 0)$$, '23514');

SELECT pg_temp.debe_fallar('Un pedido en línea sin modalidad de entrega se rechaza (RF-31)',
    $$INSERT INTO pedidos.pedido (canal, cliente_id, subtotal, impuesto, total)
      VALUES ('en_linea', pg_temp.cliente_prueba(), 0, 0, 0)$$, '23514');

SELECT pg_temp.debe_fallar('Una venta externa sin administrador que la registre se rechaza (RF-17)',
    $$INSERT INTO pedidos.pedido (canal, cliente_id, subtotal, impuesto, total)
      VALUES ('presencial', pg_temp.cliente_prueba(), 0, 0, 0)$$, '23514');

SELECT pg_temp.debe_funcionar('Una venta presencial registrada por el administrador se acepta (RF-17)',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_fallar('Un estado de pedido fuera de RF-26 se rechaza',
    $$UPDATE pedidos.pedido SET estado = 'despachado'$$, '23514');

SELECT pg_temp.debe_fallar('Un estado de pago desconocido se rechaza',
    $$UPDATE pedidos.pedido SET estado_pago = 'regalado'$$, '23514');

SELECT pg_temp.debe_funcionar('Se registra una línea con parte en contrapedido (RF-23)',
    $$INSERT INTO pedidos.linea_pedido (pedido_id, producto_id, cantidad, cantidad_contrapedido, precio_unitario)
      VALUES ((SELECT max(id) FROM pedidos.pedido),
              (SELECT id FROM catalogo.producto WHERE sku = 'PRB-PED'), 3, 1, 1500)$$);

SELECT pg_temp.debe_fallar('El contrapedido no puede superar la cantidad de la línea',
    $$INSERT INTO pedidos.linea_pedido (pedido_id, producto_id, cantidad, cantidad_contrapedido, precio_unitario)
      VALUES (pg_temp.pedido_prueba(),
              (SELECT id FROM catalogo.producto WHERE sku = 'PRB-PED'), 1, 2, 1500)$$, '23514');

SELECT pg_temp.debe_fallar('Una línea de pedido no se puede editar',
    $$UPDATE pedidos.linea_pedido SET precio_unitario = 1$$, '23001');

SELECT pg_temp.debe_funcionar('Se registra una transición de estado con su fecha (RF-26)',
    $$INSERT INTO pedidos.historial_estado (pedido_id, estado)
      VALUES ((SELECT max(id) FROM pedidos.pedido), 'colocado')$$);

SELECT pg_temp.debe_fallar('El historial de estados no se puede editar',
    $$UPDATE pedidos.historial_estado SET estado = 'finalizado'$$, '23001');
