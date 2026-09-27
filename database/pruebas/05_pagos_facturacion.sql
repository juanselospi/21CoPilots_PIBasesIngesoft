-- Restricciones de pagos y facturación (RF-39, RF-40, RF-41, RNF-06)

SELECT pg_temp.debe_fallar('Un intento de pago sin pedido ni carrito se rechaza',
    $$INSERT INTO pagos.intento_pago (metodo, monto) VALUES ('tarjeta', 1000)$$, '23514');

SELECT pg_temp.debe_funcionar('Un intento sin referencia externa se registra si la pasarela no responde (RNF-06)',
    $$INSERT INTO pagos.intento_pago (pedido_id, metodo, monto, resultado, resuelto_en)
      VALUES (pg_temp.pedido_prueba(), 'tarjeta', 1000, 'no_disponible', now())$$);

SELECT pg_temp.debe_fallar('Un intento resuelto debe tener fecha de resolución (RF-40)',
    $$INSERT INTO pagos.intento_pago (pedido_id, metodo, monto, resultado)
      VALUES (pg_temp.pedido_prueba(), 'tarjeta', 1000, 'aprobado')$$, '23514');

SELECT pg_temp.debe_funcionar('Se registra una factura pendiente',
    $$INSERT INTO facturacion.factura (pedido_id, emisor_razon_social, emisor_cedula_juridica,
                                       receptor_nombre, receptor_cedula, subtotal, impuesto, total)
      VALUES ((SELECT max(id) FROM pedidos.pedido), 'Sociedad', '3-101-000000',
              'Cliente de prueba', '9-9999-9999', 0, 0, 0)$$);

SELECT pg_temp.debe_fallar('Un pedido no puede tener dos facturas',
    $$INSERT INTO facturacion.factura (pedido_id, emisor_razon_social, emisor_cedula_juridica,
                                       receptor_nombre, receptor_cedula, subtotal, impuesto, total)
      VALUES ((SELECT max(id) FROM pedidos.pedido), 'Sociedad', '3-101-000000',
              'Cliente de prueba', '9-9999-9999', 0, 0, 0)$$, '23505');

SELECT pg_temp.debe_fallar('Una factura emitida debe tener consecutivo y fecha de emisión',
    $$UPDATE facturacion.factura SET estado = 'emitida'
      WHERE pedido_id = (SELECT max(id) FROM pedidos.pedido)$$, '23514');
