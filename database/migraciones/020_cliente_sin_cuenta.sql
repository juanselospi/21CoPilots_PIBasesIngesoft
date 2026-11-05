-- =====================================================================
-- 020 — cliente para las ventas a alguien sin cuenta
-- Historia/tarea: SCRUM-141
-- Justificación: modelo-datos.md § 4, C-25
-- =====================================================================

-- Un pedido manual tiene que ir a nombre de un cliente, pero quien compra
-- en el local o por WhatsApp muchas veces no tiene cuenta. Esos pedidos van
-- a esta cuenta y el nombre real queda en pedidos.pedido.nombre_destinatario.
-- El servidor la busca por este correo.
--
-- Nadie puede entrar con ella: la contraseña es el hash de un valor
-- aleatorio que no se guarda en ningún lado. La cédula no es de una persona;
-- las reales solo llevan dígitos, así que no choca con ninguna.
INSERT INTO usuarios.usuario (correo, contrasena, nombre)
VALUES ('venta.sin.cuenta@dchobbies.local', crypt(gen_random_uuid()::text, gen_salt('bf', 10)), 'Venta sin cuenta');

INSERT INTO clientes.cliente (correo_usuario, cedula)
VALUES ('venta.sin.cuenta@dchobbies.local', 'SIN-CUENTA');
