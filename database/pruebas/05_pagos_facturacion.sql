-- Restricciones de pagos y facturación

SELECT pg_temp.pedido_prueba();

SELECT pg_temp.debe_funcionar('Se registra un pago rechazado del pedido',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, estado_pago, correo_cliente, num_carrito)
      SELECT 'PRB-PAGO-1', 1695, 'tarjeta', 'rechazado', correo_cliente, num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba() LIMIT 1$$);

SELECT pg_temp.debe_funcionar('El mismo pedido admite otro pago (Necesita, 1 a N)',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, estado_pago, correo_cliente, num_carrito)
      SELECT 'PRB-PAGO-2', 1695, 'tarjeta', 'aprobado', correo_cliente, num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba() LIMIT 1$$);

SELECT pg_temp.debe_fallar('Un número de referencia repetido se rechaza (PK)',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, correo_cliente, num_carrito)
      SELECT 'PRB-PAGO-1', 1695, 'tarjeta', correo_cliente, num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba() LIMIT 1$$, '23505');

SELECT pg_temp.debe_fallar('Un pago sin pedido se rechaza',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, correo_cliente, num_carrito)
      VALUES ('PRB-PAGO-3', 1000, 'tarjeta', pg_temp.cliente_prueba(), 999)$$, '23503');

SELECT pg_temp.debe_fallar('Un monto negativo se rechaza',
    $$UPDATE pagos.pago SET monto = -1 WHERE num_referencia = 'PRB-PAGO-2'$$, '23514');

SELECT pg_temp.debe_fallar('Un método de pago desconocido se rechaza',
    $$UPDATE pagos.pago SET metodo_pago = 'trueque' WHERE num_referencia = 'PRB-PAGO-2'$$, '23514');

SELECT pg_temp.debe_fallar('Un estado de pago desconocido se rechaza',
    $$UPDATE pagos.pago SET estado_pago = 'regalado' WHERE num_referencia = 'PRB-PAGO-2'$$, '23514');

SELECT pg_temp.debe_funcionar('Se emite la factura del pago (Respalda)',
    $$INSERT INTO facturacion.factura (num_factura, num_referencia)
      VALUES ('PRB-FE-1', 'PRB-PAGO-2')$$);

SELECT pg_temp.debe_fallar('Un pago no puede tener dos facturas (0..1)',
    $$INSERT INTO facturacion.factura (num_factura, num_referencia)
      VALUES ('PRB-FE-2', 'PRB-PAGO-2')$$, '23505');

SELECT pg_temp.debe_fallar('Una factura sin pago se rechaza',
    $$INSERT INTO facturacion.factura (num_factura, num_referencia)
      VALUES ('PRB-FE-3', 'NO-EXISTE')$$, '23503');
