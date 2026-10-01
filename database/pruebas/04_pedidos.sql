-- Restricciones de carritos, ofertas, pedidos e historial (RN-14, RF-24, RF-25, RF-26)

SELECT pg_temp.producto_prueba('PRB-PED', 5);

SELECT pg_temp.debe_funcionar('Se crea un carrito activo (RN-14)',
    $$INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
      VALUES (pg_temp.cliente_prueba(), 100)$$);

SELECT pg_temp.debe_fallar('No puede haber dos carritos activos para el mismo cliente',
    $$INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
      VALUES (pg_temp.cliente_prueba(), 101)$$, '23505');

SELECT pg_temp.debe_fallar('El número de carrito no se repite para el mismo cliente (llave parcial)',
    $$INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_cierre)
      VALUES (pg_temp.cliente_prueba(), 100, 'convertido', now())$$, '23505');

SELECT pg_temp.debe_fallar('Un administrador no tiene carrito (solo CLIENTE)',
    $$INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
      VALUES (pg_temp.admin_prueba(), 1)$$, '23503');

SELECT pg_temp.debe_fallar('Un carrito convertido debe tener fecha de cierre',
    $$UPDATE pedidos.carrito SET estado_carrito = 'convertido'
      WHERE correo_cliente = pg_temp.cliente_prueba() AND num_carrito = 100$$, '23514');

SELECT pg_temp.debe_funcionar('Se agrega un producto al carrito con su precio y tasa',
    $$INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                  precio_unitario, tasa_impuesto_aplicada)
      VALUES (pg_temp.cliente_prueba(), 100, 'PRB-PED', 2, 1500, 13)$$);

SELECT pg_temp.debe_fallar('Una cantidad solicitada de cero se rechaza',
    $$UPDATE pedidos.agrega SET cantidad_solicitada = 0 WHERE sku = 'PRB-PED'$$, '23514');

SELECT pg_temp.debe_fallar('Un producto inexistente no se agrega al carrito',
    $$INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                  precio_unitario, tasa_impuesto_aplicada)
      VALUES (pg_temp.cliente_prueba(), 100, 'NO-EXISTE', 1, 1500, 13)$$, '23503');

SELECT pg_temp.debe_funcionar('Se crea una oferta',
    $$INSERT INTO pedidos.oferta (codigo_oferta, nombre, fecha_inicio, fecha_fin, porcentaje_descuento)
      VALUES ('PRUEBA5', 'Prueba', DATE '2026-01-01', DATE '2026-12-31', 5)$$);

SELECT pg_temp.debe_fallar('Una oferta que termina antes de empezar se rechaza',
    $$INSERT INTO pedidos.oferta (codigo_oferta, nombre, fecha_inicio, fecha_fin, porcentaje_descuento)
      VALUES ('MAL1', 'Mala', DATE '2026-12-31', DATE '2026-01-01', 5)$$, '23514');

SELECT pg_temp.debe_fallar('Una oferta con descuento mayor a 100 % se rechaza',
    $$INSERT INTO pedidos.oferta (codigo_oferta, nombre, fecha_inicio, fecha_fin, porcentaje_descuento)
      VALUES ('MAL2', 'Mala', DATE '2026-01-01', DATE '2026-12-31', 150)$$, '23514');

SELECT pg_temp.debe_funcionar('Un carrito convertido se vuelve pedido (Convierte)',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_fallar('Un carrito solo se convierte en un pedido (0..1)',
    $$INSERT INTO pedidos.pedido (correo_cliente, num_carrito, modalidad_entrega)
      SELECT correo_cliente, num_carrito, 'mensajero' FROM pedidos.pedido
      WHERE  correo_cliente = pg_temp.cliente_prueba() LIMIT 1$$, '23505');

SELECT pg_temp.debe_fallar('Un pedido sin carrito se rechaza',
    $$INSERT INTO pedidos.pedido (correo_cliente, num_carrito, modalidad_entrega)
      VALUES (pg_temp.cliente_prueba(), 999, 'mensajero')$$, '23503');

SELECT pg_temp.debe_fallar('Una modalidad de entrega desconocida se rechaza (RF-62)',
    $$UPDATE pedidos.pedido SET modalidad_entrega = 'dron'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_fallar('La fecha de entrega no puede ser anterior al pedido',
    $$UPDATE pedidos.pedido SET fecha_entrega = fecha_pedido_realizado - interval '1 day'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_fallar('Un pedido con una oferta inexistente se rechaza',
    $$UPDATE pedidos.pedido SET codigo_oferta = 'NO-EXISTE'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23503');

SELECT pg_temp.debe_funcionar('Se aplica una oferta al pedido (Aplicar)',
    $$UPDATE pedidos.pedido SET codigo_oferta = 'PRUEBA5'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_funcionar('Se registra el primer cambio de estado (RF-26)',
    $$INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, numero_cambio, estado)
      SELECT correo_cliente, num_carrito, 1, 'colocado' FROM pedidos.pedido
      WHERE  correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_fallar('El número de cambio no se repite en el mismo pedido (llave parcial)',
    $$INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, numero_cambio, estado)
      SELECT correo_cliente, num_carrito, 1, 'procesado' FROM pedidos.pedido
      WHERE  correo_cliente = pg_temp.cliente_prueba()$$, '23505');

SELECT pg_temp.debe_fallar('Un estado fuera de RF-26 se rechaza',
    $$INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, numero_cambio, estado)
      SELECT correo_cliente, num_carrito, 2, 'despachado' FROM pedidos.pedido
      WHERE  correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_fallar('El historial de estados no se puede editar',
    $$UPDATE pedidos.historial_estado SET estado = 'finalizado'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23001');

SELECT pg_temp.debe_fallar('El historial de estados no se puede borrar',
    $$DELETE FROM pedidos.historial_estado
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23001');

SELECT pg_temp.debe_cumplirse('El estado derivado del pedido es el último cambio',
    (SELECT estado FROM reportes.v_estado_pedido
     WHERE  correo_cliente = pg_temp.cliente_prueba()) = 'colocado');

SELECT pg_temp.debe_funcionar('Cambiar el correo del cliente se propaga hasta el historial',
    $$UPDATE admin.usuario SET correo = 'renombrado@prueba.test'
      WHERE correo = 'cliente.prueba@prueba.test'$$);

SELECT pg_temp.debe_cumplirse('Carrito, pedido e historial quedaron con el correo nuevo',
    EXISTS (SELECT 1 FROM pedidos.carrito          WHERE correo_cliente = 'renombrado@prueba.test')
    AND EXISTS (SELECT 1 FROM pedidos.pedido           WHERE correo_cliente = 'renombrado@prueba.test')
    AND EXISTS (SELECT 1 FROM pedidos.historial_estado WHERE correo_cliente = 'renombrado@prueba.test'));
