-- Restricciones del inventario (RES-07, RN-06, RN-13, RF-15, RF-19, RF-20)

SELECT pg_temp.producto_prueba('PRB-INV', 3);

SELECT pg_temp.debe_fallar('Las existencias no pueden quedar negativas (RN-13)',
    $$UPDATE inventario.existencia SET cantidad = cantidad - 4
      WHERE producto_id = (SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV')$$, '23514');

SELECT pg_temp.debe_funcionar('Un ingreso con costo se registra (RF-13, RF-14)',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, costo_unitario, responsable_id)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'ingreso', 10, 1200,
              pg_temp.admin_prueba())$$);

SELECT pg_temp.debe_fallar('Un ingreso sin costo se rechaza (RN-06)',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'ingreso', 5)$$, '23514');

SELECT pg_temp.debe_fallar('Un movimiento no se puede editar (RF-19)',
    $$UPDATE inventario.movimiento SET cantidad = 99
      WHERE producto_id = (SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV')$$, '23001');

SELECT pg_temp.debe_fallar('Un movimiento no se puede borrar (RF-19)',
    $$DELETE FROM inventario.movimiento
      WHERE producto_id = (SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV')$$, '23001');

SELECT pg_temp.debe_fallar('Un ajuste sin motivo se rechaza (RF-20)',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, responsable_id)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'ajuste', -1,
              pg_temp.admin_prueba())$$, '23514');

SELECT pg_temp.debe_fallar('Un ajuste sin responsable se rechaza (RF-20)',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, motivo)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'ajuste', -1, 'Merma')$$, '23514');

SELECT pg_temp.debe_funcionar('Un ajuste con motivo y responsable se registra (RF-20)',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, motivo, responsable_id)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'ajuste', -1, 'Merma',
              pg_temp.admin_prueba())$$);

SELECT pg_temp.debe_fallar('Una venta sin pedido se rechaza',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'venta', -1)$$, '23514');

SELECT pg_temp.debe_fallar('Una venta con cantidad positiva se rechaza',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, pedido_id)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'venta', 1,
              pg_temp.pedido_prueba())$$, '23514');

SELECT pg_temp.debe_fallar('Un tipo de movimiento desconocido se rechaza',
    $$INSERT INTO inventario.movimiento (producto_id, tipo, cantidad)
      VALUES ((SELECT id FROM catalogo.producto WHERE sku = 'PRB-INV'), 'regalo', -1)$$, '23514');
