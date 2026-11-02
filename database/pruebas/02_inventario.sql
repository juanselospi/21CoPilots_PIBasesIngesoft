-- Restricciones del registro de mercancía (PRODUCTO_ADMINISTRA)

SELECT pg_temp.producto_prueba('PRB-INV', 3);

SELECT pg_temp.debe_funcionar('El administrador registra mercancía',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 10, 'ingreso')$$);

SELECT pg_temp.debe_fallar('Un cliente no puede registrar mercancía (solo ADMINISTRADOR)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-INV', pg_temp.cliente_prueba(), 10, 'ingreso')$$, '23503');

SELECT pg_temp.debe_fallar('No se registra mercancía de un producto inexistente',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('NO-EXISTE', pg_temp.admin_prueba(), 10, 'ingreso')$$, '23503');

SELECT pg_temp.debe_fallar('Un registro con cantidad cero se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 0, 'ingreso')$$, '23514');

SELECT pg_temp.debe_fallar('El mismo producto y fecha no se repiten (PK, 013)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad, tipo)
      SELECT sku, correo_administrador, fecha, 5, 'ingreso'
      FROM   inventario.producto_administra WHERE sku = 'PRB-INV'$$, '23505');

SELECT pg_temp.debe_funcionar('Dos ingresos del mismo producto en una transacción se guardan (clock_timestamp)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo, costo_unitario)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 4, 'ingreso', 1000);
      INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo, costo_unitario)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 6, 'ingreso', 1100)$$);

SELECT pg_temp.debe_fallar('Un movimiento sin tipo se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 1)$$, '23502');

SELECT pg_temp.debe_fallar('Un tipo de movimiento desconocido se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 1, 'regalo')$$, '23514');

SELECT pg_temp.debe_fallar('Un ajuste sin motivo se rechaza (RF-20)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), -1, 'ajuste')$$, '23514');

SELECT pg_temp.debe_fallar('Un ajuste con motivo en blanco se rechaza (RF-20)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo, motivo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), -1, 'ajuste', '   ')$$, '23514');

SELECT pg_temp.debe_funcionar('Un ajuste con motivo se guarda (RF-20)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo, motivo)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), -1, 'ajuste', 'Unidad dañada en bodega')$$);

SELECT pg_temp.debe_fallar('Un costo unitario negativo se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo, costo_unitario)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 1, 'ingreso', -5)$$, '23514');

SELECT pg_temp.debe_funcionar('Una venta en línea se registra sin administrador',
    $$INSERT INTO inventario.producto_administra (sku, cantidad, tipo)
      VALUES ('PRB-INV', -1, 'venta_en_linea')$$);

SELECT pg_temp.debe_fallar('Un ingreso sin administrador se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, cantidad, tipo)
      VALUES ('PRB-INV', 1, 'ingreso')$$, '23514');

SELECT pg_temp.debe_cumplirse('La vista del registro de mercancía muestra tipo, costo y motivo',
    EXISTS (SELECT 1 FROM reportes.v_registro_mercancia
            WHERE sku = 'PRB-INV' AND tipo = 'ajuste' AND motivo = 'Unidad dañada en bodega')
    AND EXISTS (SELECT 1 FROM reportes.v_registro_mercancia
                WHERE sku = 'PRB-INV' AND tipo = 'ingreso' AND costo_unitario = 1100));

SELECT pg_temp.debe_fallar('Un registro de mercancía no se puede editar',
    $$UPDATE inventario.producto_administra SET cantidad = 99 WHERE sku = 'PRB-INV'$$, '23001');

SELECT pg_temp.debe_fallar('Un registro de mercancía no se puede borrar',
    $$DELETE FROM inventario.producto_administra WHERE sku = 'PRB-INV'$$, '23001');

SELECT pg_temp.debe_funcionar('Cambiar el SKU se propaga al registro de mercancía',
    $$UPDATE catalogo.producto SET sku = 'PRB-INV2' WHERE sku = 'PRB-INV'$$);

SELECT pg_temp.debe_cumplirse('El registro de mercancía quedó con el SKU nuevo',
    EXISTS (SELECT 1 FROM inventario.producto_administra WHERE sku = 'PRB-INV2')
    AND NOT EXISTS (SELECT 1 FROM inventario.producto_administra WHERE sku = 'PRB-INV'));
