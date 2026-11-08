-- Teléfono de quien compra sin cuenta (022, C-27)

SELECT pg_temp.debe_funcionar('Se crea un pedido de prueba',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_cumplirse('El teléfono del destinatario es opcional',
    (SELECT bool_and(telefono_destinatario IS NULL) FROM pedidos.pedido
     WHERE correo_cliente = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_funcionar('Un pedido manual guarda el teléfono de quien compra',
    $$UPDATE pedidos.pedido SET telefono_destinatario = '8888-8888'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_fallar('Un teléfono en blanco se rechaza',
    $$UPDATE pedidos.pedido SET telefono_destinatario = '   '
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');
