-- Cliente para las ventas a alguien sin cuenta (020, C-25)

SELECT pg_temp.debe_cumplirse('Existe el cliente para ventas sin cuenta',
    EXISTS (SELECT 1 FROM clientes.cliente WHERE correo_usuario = 'venta.sin.cuenta@dchobbies.local'));

SELECT pg_temp.debe_cumplirse('No es administrador',
    NOT EXISTS (SELECT 1 FROM admin.administrador WHERE correo_usuario = 'venta.sin.cuenta@dchobbies.local'));

SELECT pg_temp.debe_cumplirse('Su contraseña es un hash bcrypt, no un texto conocido',
    (SELECT contrasena LIKE '$2%' AND length(contrasena) = 60
     FROM usuarios.usuario WHERE correo = 'venta.sin.cuenta@dchobbies.local'));

SELECT pg_temp.debe_funcionar('Un pedido manual va a su nombre con el destinatario real',
    $$WITH c AS (INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_cierre)
                 VALUES ('venta.sin.cuenta@dchobbies.local', 1, 'convertido', now()) RETURNING correo_cliente, num_carrito)
      INSERT INTO pedidos.pedido (correo_cliente, num_carrito, modalidad_entrega, canal, nombre_destinatario)
      SELECT correo_cliente, num_carrito, 'entrega_personal', 'presencial', 'María Pérez' FROM c$$);
