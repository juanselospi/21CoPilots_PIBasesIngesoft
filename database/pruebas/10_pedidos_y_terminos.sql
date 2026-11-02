-- Estado «en disputa», canal y creador del pedido, y aceptación de términos (014, C-18 y C-19)

SELECT pg_temp.debe_funcionar('Se crea un pedido de prueba',
    $$SELECT pg_temp.pedido_prueba()$$);

SELECT pg_temp.debe_cumplirse('Un pedido sin canal queda como web',
    (SELECT bool_and(canal = 'web') FROM pedidos.pedido
     WHERE correo_cliente = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_funcionar('Un pedido pasa a «en disputa» y sale de ese estado',
    $$INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha)
      SELECT correo_cliente, num_carrito, e, f
      FROM   pedidos.pedido,
             (VALUES ('colocado',   TIMESTAMPTZ '2026-10-01 10:00-06'),
                     ('en_disputa', TIMESTAMPTZ '2026-10-02 10:00-06'),
                     ('procesado',  TIMESTAMPTZ '2026-10-03 10:00-06')) AS v(e, f)
      WHERE  correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_funcionar('El mismo pedido vuelve a «en disputa» otro día',
    $$INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha)
      SELECT correo_cliente, num_carrito, 'en_disputa', TIMESTAMPTZ '2026-10-04 10:00-06'
      FROM   pedidos.pedido WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_cumplirse('El estado actual es «en disputa»',
    (SELECT estado FROM reportes.v_estado_pedido
     WHERE correo_cliente = pg_temp.cliente_prueba()) = 'en_disputa');

SELECT pg_temp.debe_funcionar('Un pedido manual por WhatsApp registra quién lo creó',
    $$UPDATE pedidos.pedido
      SET canal = 'whatsapp', creado_por = pg_temp.admin_prueba(),
          nombre_destinatario = 'María Pérez'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_fallar('Un canal desconocido se rechaza',
    $$UPDATE pedidos.pedido SET canal = 'instagram'
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_fallar('Solo un administrador puede ser el creador del pedido',
    $$WITH u AS (INSERT INTO usuarios.usuario (correo, contrasena, nombre)
                 VALUES ('nocreador@prueba.test', 'x', 'No admin') RETURNING correo)
      UPDATE pedidos.pedido SET creado_por = (SELECT correo FROM u)
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23503');

SELECT pg_temp.debe_fallar('Un destinatario en blanco se rechaza',
    $$UPDATE pedidos.pedido SET nombre_destinatario = '   '
      WHERE correo_cliente = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_funcionar('Se registra cuándo aceptó el cliente los términos (RF-38)',
    $$UPDATE clientes.cliente SET fecha_aceptacion_terminos = now()
      WHERE correo_usuario = pg_temp.cliente_prueba()$$);
