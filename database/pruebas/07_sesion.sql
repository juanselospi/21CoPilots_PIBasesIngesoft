-- Restricciones de las sesiones (RF-53)

SELECT pg_temp.debe_funcionar('Se abre una sesión del usuario',
    $$INSERT INTO usuarios.sesion (correo_usuario, token_hash, fecha_vencimiento)
      VALUES (pg_temp.cliente_prueba(), 'hash-prueba-1', now() + interval '1 hour')$$);

SELECT pg_temp.debe_fallar('Una sesión sin usuario se rechaza (entidad débil)',
    $$INSERT INTO usuarios.sesion (correo_usuario, token_hash, fecha_vencimiento)
      VALUES ('no.existe@prueba.test', 'hash-prueba-2', now() + interval '1 hour')$$, '23503');

SELECT pg_temp.debe_fallar('Un hash de token repetido se rechaza, aunque sea de otro usuario',
    $$INSERT INTO usuarios.sesion (correo_usuario, token_hash, fecha_vencimiento)
      VALUES (pg_temp.admin_prueba(), 'hash-prueba-1', now() + interval '1 hour')$$, '23505');

SELECT pg_temp.debe_fallar('Una sesión que vence antes de crearse se rechaza',
    $$INSERT INTO usuarios.sesion (correo_usuario, token_hash, fecha_vencimiento)
      VALUES (pg_temp.cliente_prueba(), 'hash-prueba-3', now() - interval '1 hour')$$, '23514');

SELECT pg_temp.debe_funcionar('Cambiar el correo del usuario se propaga a sus sesiones',
    $$UPDATE usuarios.usuario SET correo = 'sesion.renombrada@prueba.test'
      WHERE correo = 'cliente.prueba@prueba.test'$$);

SELECT pg_temp.debe_cumplirse('La sesión quedó con el correo nuevo',
    EXISTS (SELECT 1 FROM usuarios.sesion
            WHERE correo_usuario = 'sesion.renombrada@prueba.test' AND token_hash = 'hash-prueba-1'));

SELECT pg_temp.debe_funcionar('Borrar el usuario borra sus sesiones',
    $$DELETE FROM usuarios.usuario WHERE correo = 'sesion.renombrada@prueba.test'$$);

SELECT pg_temp.debe_cumplirse('No quedan sesiones del usuario borrado',
    NOT EXISTS (SELECT 1 FROM usuarios.sesion WHERE token_hash = 'hash-prueba-1'));
