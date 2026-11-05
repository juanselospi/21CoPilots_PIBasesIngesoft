-- Enlaces para recuperar la contraseña (021, C-26)

SELECT pg_temp.debe_funcionar('Se guarda un enlace con su vencimiento',
    $$INSERT INTO usuarios.recuperacion (token_hash, correo_usuario, fecha_vencimiento)
      VALUES ('hash-de-prueba', pg_temp.admin_prueba(), now() + interval '30 minutes')$$);

SELECT pg_temp.debe_funcionar('Se marca como usado',
    $$UPDATE usuarios.recuperacion SET fecha_uso = now() WHERE token_hash = 'hash-de-prueba'$$);

SELECT pg_temp.debe_fallar('El mismo hash no se repite',
    $$INSERT INTO usuarios.recuperacion (token_hash, correo_usuario, fecha_vencimiento)
      VALUES ('hash-de-prueba', pg_temp.admin_prueba(), now() + interval '30 minutes')$$, '23505');

SELECT pg_temp.debe_fallar('No puede vencer antes de crearse',
    $$INSERT INTO usuarios.recuperacion (token_hash, correo_usuario, fecha_vencimiento)
      VALUES ('otro-hash', pg_temp.admin_prueba(), now() - interval '1 minute')$$, '23514');

SELECT pg_temp.debe_fallar('Tiene que ser de un usuario que existe',
    $$INSERT INTO usuarios.recuperacion (token_hash, correo_usuario, fecha_vencimiento)
      VALUES ('otro-hash', 'nadie@prueba.test', now() + interval '30 minutes')$$, '23503');
