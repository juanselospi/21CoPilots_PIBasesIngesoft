-- Restricciones del registro de mercancía (PRODUCTO_ADMINISTRA)

SELECT pg_temp.producto_prueba('PRB-INV', 3);

SELECT pg_temp.debe_funcionar('El administrador registra mercancía',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), 10)$$);

SELECT pg_temp.debe_fallar('Un cliente no puede registrar mercancía (solo ADMINISTRADOR)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('PRB-INV', pg_temp.cliente_prueba(), 10)$$, '23503');

SELECT pg_temp.debe_fallar('No se registra mercancía de un producto inexistente',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('NO-EXISTE', pg_temp.admin_prueba(), 10)$$, '23503');

SELECT pg_temp.debe_fallar('Un registro con cantidad cero se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad)
      VALUES ('PRB-INV', pg_temp.admin_prueba(), now() + interval '1 second', 0)$$, '23514');

SELECT pg_temp.debe_fallar('El mismo producto, administrador y fecha no se repiten (PK)',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad)
      SELECT sku, correo_administrador, fecha, 5
      FROM   inventario.producto_administra WHERE sku = 'PRB-INV'$$, '23505');

SELECT pg_temp.debe_fallar('Un registro de mercancía no se puede editar',
    $$UPDATE inventario.producto_administra SET cantidad = 99 WHERE sku = 'PRB-INV'$$, '23001');

SELECT pg_temp.debe_fallar('Un registro de mercancía no se puede borrar',
    $$DELETE FROM inventario.producto_administra WHERE sku = 'PRB-INV'$$, '23001');

SELECT pg_temp.debe_funcionar('Cambiar el SKU se propaga al registro de mercancía',
    $$UPDATE catalogo.producto SET sku = 'PRB-INV2' WHERE sku = 'PRB-INV'$$);

SELECT pg_temp.debe_cumplirse('El registro de mercancía quedó con el SKU nuevo',
    EXISTS (SELECT 1 FROM inventario.producto_administra WHERE sku = 'PRB-INV2')
    AND NOT EXISTS (SELECT 1 FROM inventario.producto_administra WHERE sku = 'PRB-INV'));
