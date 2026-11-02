-- Bitácora de auditoría (015, C-20)

SELECT pg_temp.debe_funcionar('El servidor registra un cambio con valor anterior y nuevo (RF-52)',
    $$INSERT INTO admin.bitacora (correo_usuario, evento, entidad, entidad_id,
                                  valor_anterior, valor_nuevo)
      VALUES (pg_temp.admin_prueba(), 'parametro_modificado', 'producto', 'PRB-BIT',
              '{"margen_ganancia": 30}', '{"margen_ganancia": 35}')$$);

SELECT pg_temp.debe_funcionar('Dos registros del mismo usuario en una transacción no chocan',
    $$INSERT INTO admin.bitacora (correo_usuario, evento)
      VALUES (pg_temp.cliente_prueba(), 'acceso_denegado'),
             (pg_temp.cliente_prueba(), 'acceso_denegado')$$);

SELECT pg_temp.debe_cumplirse('Cada registro toma su propia fecha',
    (SELECT count(DISTINCT fecha) = 2 FROM admin.bitacora
     WHERE correo_usuario = pg_temp.cliente_prueba()));

SELECT pg_temp.debe_fallar('Un registro sin usuario se rechaza',
    $$INSERT INTO admin.bitacora (correo_usuario, evento) VALUES (NULL, 'acceso_denegado')$$, '23502');

SELECT pg_temp.debe_fallar('Un usuario que no existe se rechaza',
    $$INSERT INTO admin.bitacora (correo_usuario, evento)
      VALUES ('nadie@prueba.test', 'acceso_denegado')$$, '23503');

SELECT pg_temp.debe_fallar('Un evento en blanco se rechaza',
    $$INSERT INTO admin.bitacora (correo_usuario, evento)
      VALUES (pg_temp.admin_prueba(), '  ')$$, '23514');

SELECT pg_temp.debe_fallar('Un registro de la bitácora no se edita',
    $$UPDATE admin.bitacora SET evento = 'otro'
      WHERE correo_usuario = pg_temp.admin_prueba()$$, '23001');

SELECT pg_temp.debe_fallar('Un registro de la bitácora no se borra',
    $$DELETE FROM admin.bitacora WHERE correo_usuario = pg_temp.admin_prueba()$$, '23001');

SELECT pg_temp.debe_fallar('No se borra un usuario que tiene registros en la bitácora',
    $$DELETE FROM usuarios.usuario WHERE correo = pg_temp.cliente_prueba()$$, '23503');

SELECT pg_temp.debe_funcionar('Si el usuario cambia de correo, la bitácora lo sigue',
    $$UPDATE usuarios.usuario SET correo = 'cliente.nuevo@prueba.test'
      WHERE correo = pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_cumplirse('Los registros quedan con el correo nuevo',
    (SELECT count(*) = 2 FROM admin.bitacora
     WHERE correo_usuario = 'cliente.nuevo@prueba.test'));
