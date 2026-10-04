-- Restricciones de usuarios, administrador y clientes

SELECT pg_temp.debe_funcionar('Existe un administrador',
    $$SELECT pg_temp.admin_prueba()$$);

SELECT pg_temp.debe_fallar('No puede haber dos administradores (RF-49)',
    $$WITH u AS (INSERT INTO usuarios.usuario (correo, contrasena, nombre)
                 VALUES ('admin2.prueba@prueba.test', 'x', 'Dos') RETURNING correo)
      INSERT INTO admin.administrador (correo_usuario) SELECT correo FROM u$$, '23505');

SELECT pg_temp.debe_fallar('Un correo con mayúsculas se rechaza (se guarda normalizado)',
    $$INSERT INTO usuarios.usuario (correo, contrasena, nombre)
      VALUES ('Mayusculas@prueba.test', 'x', 'Uno')$$, '23514');

SELECT pg_temp.debe_fallar('Un correo repetido se rechaza (PK)',
    $$INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES
        ('repetido@prueba.test', 'x', 'Uno'),
        ('repetido@prueba.test', 'x', 'Dos')$$, '23505');

SELECT pg_temp.debe_fallar('Un correo sin arroba se rechaza',
    $$INSERT INTO usuarios.usuario (correo, contrasena, nombre)
      VALUES ('sin-arroba.prueba.test', 'x', 'Uno')$$, '23514');

SELECT pg_temp.debe_funcionar('Se registra un cliente (subtipo de USUARIO)',
    $$SELECT pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_fallar('Un cliente sin usuario se rechaza',
    $$INSERT INTO clientes.cliente (correo_usuario, cedula)
      VALUES ('no.existe@prueba.test', '5-5555-5555')$$, '23503');

SELECT pg_temp.debe_fallar('El administrador no puede ser también cliente (especialización disjunta)',
    $$INSERT INTO clientes.cliente (correo_usuario, cedula)
      VALUES (pg_temp.admin_prueba(), '6-6666-6666')$$, '23514');

SELECT pg_temp.debe_fallar('Un cliente no puede ser también administrador (especialización disjunta)',
    $$INSERT INTO admin.administrador (correo_usuario) VALUES (pg_temp.cliente_prueba())$$, '23514');

SELECT pg_temp.debe_fallar('Un cliente sin cédula se rechaza (RN-18)',
    $$WITH u AS (INSERT INTO usuarios.usuario (correo, contrasena, nombre)
                 VALUES ('sincedula@prueba.test', 'x', 'Sin cédula') RETURNING correo)
      INSERT INTO clientes.cliente (correo_usuario, cedula) SELECT correo, '  ' FROM u$$, '23514');

SELECT pg_temp.debe_fallar('Una cédula repetida se rechaza',
    $$WITH u AS (INSERT INTO usuarios.usuario (correo, contrasena, nombre)
                 VALUES ('otro@prueba.test', 'x', 'Otro') RETURNING correo)
      INSERT INTO clientes.cliente (correo_usuario, cedula) SELECT correo, '9-9999-9999' FROM u$$, '23505');

SELECT pg_temp.debe_funcionar('Se registra un teléfono del cliente',
    $$INSERT INTO clientes.cliente_telefono (correo_usuario, telefono)
      VALUES (pg_temp.cliente_prueba(), '8000-0000')$$);

SELECT pg_temp.debe_fallar('Un teléfono repetido del mismo cliente se rechaza',
    $$INSERT INTO clientes.cliente_telefono (correo_usuario, telefono)
      VALUES (pg_temp.cliente_prueba(), '8000-0000')$$, '23505');

SELECT pg_temp.debe_fallar('Un número de compras negativo se rechaza',
    $$UPDATE clientes.cliente SET num_compras = -1
      WHERE correo_usuario = pg_temp.cliente_prueba()$$, '23514');

SELECT pg_temp.debe_funcionar('Cambiar el correo del usuario se propaga al cliente',
    $$UPDATE usuarios.usuario SET correo = 'nuevo.correo@prueba.test'
      WHERE correo = 'cliente.prueba@prueba.test'$$);

SELECT pg_temp.debe_cumplirse('Cliente y teléfono quedaron con el correo nuevo',
    EXISTS (SELECT 1 FROM clientes.cliente WHERE correo_usuario = 'nuevo.correo@prueba.test')
    AND EXISTS (SELECT 1 FROM clientes.cliente_telefono WHERE correo_usuario = 'nuevo.correo@prueba.test'));
