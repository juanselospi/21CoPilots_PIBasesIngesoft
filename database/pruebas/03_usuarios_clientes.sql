-- Restricciones de usuarios, bitácora y clientes

SELECT pg_temp.debe_fallar('No puede haber dos administradores (RF-49)',
    $$INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol) VALUES
        ('admin1.prueba@prueba.test', 'x', 'Uno', 'administrador'),
        ('admin2.prueba@prueba.test', 'x', 'Dos', 'administrador')$$, '23505');

SELECT pg_temp.debe_fallar('Un correo repetido con otras mayúsculas se rechaza',
    $$INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol) VALUES
        ('repetido@prueba.test', 'x', 'Uno', 'cliente'),
        ('REPETIDO@prueba.test', 'x', 'Dos', 'cliente')$$, '23505');

SELECT pg_temp.debe_fallar('Un rol desconocido se rechaza (RF-50)',
    $$INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol)
      VALUES ('rol@prueba.test', 'x', 'Rol', 'empleado')$$, '23514');

SELECT pg_temp.debe_funcionar('Un cliente sin cuenta se registra (RF-17, RF-60)',
    $$SELECT pg_temp.cliente_prueba()$$);

SELECT pg_temp.debe_fallar('Un cliente sin cédula se rechaza (RN-18)',
    $$INSERT INTO clientes.cliente (nombre, correo, tipo_cedula, cedula)
      VALUES ('Sin cédula', 'sincedula@prueba.test', 'fisica', '  ')$$, '23514');

SELECT pg_temp.debe_fallar('Una cédula repetida se rechaza',
    $$INSERT INTO clientes.cliente (nombre, correo, tipo_cedula, cedula)
      VALUES ('Otro', 'otro@prueba.test', 'fisica', '9-9999-9999')$$, '23505');

SELECT pg_temp.debe_funcionar('La bitácora registra una operación sensible (RF-52)',
    $$INSERT INTO admin.bitacora (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo)
      VALUES (pg_temp.admin_prueba(), 'cambio_margen', 'producto', 'PRB-001',
              '{"margen": 25}', '{"margen": 30}')$$);

SELECT pg_temp.debe_fallar('La bitácora no se puede editar (RF-52)',
    $$UPDATE admin.bitacora SET accion = 'otra'$$, '23001');

SELECT pg_temp.debe_fallar('El consentimiento necesita un titular (RF-38)',
    $$INSERT INTO clientes.consentimiento_terminos (version_terminos) VALUES ('1.0')$$, '23514');

SELECT pg_temp.debe_fallar('Un nivel con descuento mayor a 100 % se rechaza',
    $$INSERT INTO clientes.nivel_fidelidad (nivel, compras_minimas, porcentaje_descuento)
      VALUES (99, 99, 150)$$, '23514');
