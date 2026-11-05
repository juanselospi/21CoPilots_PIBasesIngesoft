-- Varios administradores y un solo propietario (016, C-21)

SELECT pg_temp.debe_funcionar('Existe un administrador',
    $$SELECT pg_temp.admin_prueba()$$);

-- Sin datos de prueba, el administrador de prueba pasa a ser el propietario
SELECT pg_temp.debe_funcionar('Hay un propietario',
    $$UPDATE admin.administrador SET es_propietario = true
      WHERE correo_usuario = pg_temp.admin_prueba()
        AND NOT EXISTS (SELECT 1 FROM admin.administrador WHERE es_propietario)$$);

SELECT pg_temp.debe_funcionar('El propietario crea la cuenta de un empleado',
    $$WITH u AS (INSERT INTO usuarios.usuario (correo, contrasena, nombre)
                 VALUES ('empleado.prueba@prueba.test', 'x', 'Empleado') RETURNING correo)
      INSERT INTO admin.administrador (correo_usuario, creado_por)
      SELECT correo, (SELECT correo_usuario FROM admin.administrador WHERE es_propietario)
      FROM u$$);

SELECT pg_temp.debe_cumplirse('Una cuenta nueva es activa y no es propietaria',
    (SELECT activo AND NOT es_propietario FROM admin.administrador
     WHERE correo_usuario = 'empleado.prueba@prueba.test'));

SELECT pg_temp.debe_cumplirse('Hay dos administradores y solo uno es propietario (RF-49)',
    (SELECT count(*) >= 2 AND count(*) FILTER (WHERE es_propietario) = 1
     FROM admin.administrador));

SELECT pg_temp.debe_fallar('No puede haber dos propietarios (RF-49)',
    $$UPDATE admin.administrador SET es_propietario = true
      WHERE correo_usuario = 'empleado.prueba@prueba.test'$$, '23505');

SELECT pg_temp.debe_fallar('Una cuenta no se crea a sí misma',
    $$UPDATE admin.administrador SET creado_por = correo_usuario
      WHERE correo_usuario = 'empleado.prueba@prueba.test'$$, '23514');

SELECT pg_temp.debe_fallar('El creador tiene que ser un administrador',
    $$UPDATE admin.administrador SET creado_por = 'nadie@prueba.test'
      WHERE correo_usuario = 'empleado.prueba@prueba.test'$$, '23503');

SELECT pg_temp.debe_funcionar('Un empleado se desactiva sin borrarlo',
    $$UPDATE admin.administrador SET activo = false
      WHERE correo_usuario = 'empleado.prueba@prueba.test'$$);

SELECT pg_temp.debe_fallar('El propietario no se puede desactivar',
    $$UPDATE admin.administrador SET activo = false WHERE es_propietario$$, '23514');

SELECT pg_temp.debe_funcionar('El dueño se traspasa en dos pasos: primero se quita, luego se asigna',
    $$UPDATE admin.administrador SET activo = true
      WHERE correo_usuario = 'empleado.prueba@prueba.test';
      UPDATE admin.administrador SET es_propietario = false WHERE es_propietario;
      UPDATE admin.administrador SET es_propietario = true
      WHERE correo_usuario = 'empleado.prueba@prueba.test'$$);

SELECT pg_temp.debe_cumplirse('Sigue habiendo un solo propietario',
    (SELECT count(*) = 1 AND bool_and(correo_usuario = 'empleado.prueba@prueba.test')
     FROM admin.administrador WHERE es_propietario));

SELECT pg_temp.debe_funcionar('Cambiar el correo de quien creó una cuenta se propaga a creado_por',
    $$UPDATE admin.administrador SET creado_por = (SELECT correo_usuario FROM admin.administrador
                                                    WHERE es_propietario)
      WHERE correo_usuario <> (SELECT correo_usuario FROM admin.administrador WHERE es_propietario);
      UPDATE usuarios.usuario SET correo = 'propietario.nuevo@prueba.test'
      WHERE correo = (SELECT correo_usuario FROM admin.administrador WHERE es_propietario)$$);

SELECT pg_temp.debe_cumplirse('Las cuentas que creó quedaron con el correo nuevo',
    (SELECT bool_and(creado_por = 'propietario.nuevo@prueba.test') FROM admin.administrador
     WHERE NOT es_propietario));
