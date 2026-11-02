-- Créditos a favor del cliente (017, C-22)

SELECT pg_temp.debe_funcionar('Se crea un pedido de prueba',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_funcionar('Quitar un producto de un pedido pagado otorga un crédito',
    $$INSERT INTO clientes.credito (correo_cliente, monto, motivo, num_carrito_pedido)
      SELECT correo_cliente, 20, 'Se quitó un producto del pedido', num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_funcionar('Un crédito puede no venir de un pedido',
    $$INSERT INTO clientes.credito (correo_cliente, monto, motivo)
      VALUES (pg_temp.cliente_prueba(), 5, 'Compensación por un problema')$$);

SELECT pg_temp.debe_cumplirse('El saldo es la suma de los créditos',
    (SELECT saldo = 25 AND usado = 0 FROM reportes.v_saldo_credito
     WHERE correo_cliente = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_fallar('Un crédito de 0 se rechaza',
    $$INSERT INTO clientes.credito (correo_cliente, monto, motivo)
      VALUES (pg_temp.cliente_prueba(), 0, 'x')$$, '23514');

SELECT pg_temp.debe_fallar('Un crédito sin motivo se rechaza',
    $$INSERT INTO clientes.credito (correo_cliente, monto, motivo)
      VALUES (pg_temp.cliente_prueba(), 1, '  ')$$, '23514');

SELECT pg_temp.debe_fallar('El pedido de origen tiene que ser del mismo cliente',
    $$INSERT INTO clientes.credito (correo_cliente, monto, motivo, num_carrito_pedido)
      VALUES (pg_temp.cliente_prueba(), 1, 'x', 9999)$$, '23503');

SELECT pg_temp.debe_fallar('Un crédito no se edita',
    $$UPDATE clientes.credito SET monto = 100
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23001');

SELECT pg_temp.debe_fallar('Un crédito no se borra',
    $$DELETE FROM clientes.credito WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23001');

SELECT pg_temp.debe_funcionar('El crédito paga una parte y la diferencia va con otro método',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, estado_pago, correo_cliente, num_carrito)
      SELECT r, m, mp, 'aprobado', correo_cliente, num_carrito
      FROM   pedidos.pedido,
             (VALUES ('PRB-CRED-1', 15, 'credito'), ('PRB-TARJ-1', 30, 'tarjeta')) AS v(r, m, mp)
      WHERE  correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_cumplirse('El saldo baja con lo usado',
    (SELECT saldo = 10 AND usado = 15 FROM reportes.v_saldo_credito
     WHERE correo_cliente = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_fallar('No se usa más crédito del saldo',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, correo_cliente, num_carrito)
      SELECT 'PRB-CRED-2', 10.01, 'credito', correo_cliente, num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_funcionar('Se puede usar el saldo exacto',
    $$INSERT INTO pagos.pago (num_referencia, monto, metodo_pago, correo_cliente, num_carrito)
      SELECT 'PRB-CRED-2', 10, 'credito', correo_cliente, num_carrito
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_funcionar('Un pago con crédito rechazado devuelve el saldo',
    $$UPDATE pagos.pago SET estado_pago = 'rechazado' WHERE num_referencia = 'PRB-CRED-2'$$);

SELECT pg_temp.debe_cumplirse('El saldo vuelve a 10',
    (SELECT saldo = 10 FROM reportes.v_saldo_credito
     WHERE correo_cliente = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_fallar('Reactivar el pago no puede pasar del saldo',
    $$UPDATE pagos.pago SET estado_pago = 'aprobado', monto = 11
      WHERE num_referencia = 'PRB-CRED-2'$$, '23514');

SELECT pg_temp.debe_funcionar('Al editar un pago con crédito no se cuenta su monto anterior',
    $$UPDATE pagos.pago SET monto = 25 WHERE num_referencia = 'PRB-CRED-1'$$);

SELECT pg_temp.debe_cumplirse('El crédito quedó usado por completo',
    (SELECT saldo = 0 FROM reportes.v_saldo_credito
     WHERE correo_cliente = pg_temp.cliente_prueba()));
