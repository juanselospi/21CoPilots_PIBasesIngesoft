-- Datos de prueba: usuarios y un cliente. SOLO para desarrollo local.
-- Contraseñas guardadas como hash bcrypt (compatible con bcrypt/bcryptjs en Node).
--   admin@dchobbies.test   / Admin123!
--   cliente@correo.test    / Cliente123!

INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol) VALUES
    ('admin@dchobbies.test', crypt('Admin123!',   gen_salt('bf', 10)), 'Administración DC Hobbies', 'administrador'),
    ('cliente@correo.test',  crypt('Cliente123!', gen_salt('bf', 10)), 'Cliente de Prueba',         'cliente')
ON CONFLICT DO NOTHING;

-- Cliente con cuenta
INSERT INTO clientes.cliente (usuario_id, nombre, correo, tipo_cedula, cedula, direccion)
SELECT u.id, 'Cliente de Prueba', 'cliente@correo.test', 'fisica', '1-1111-1111',
       'San Pedro, Montes de Oca, San José'
FROM   admin.usuario u
WHERE  u.correo = 'cliente@correo.test'
ON CONFLICT DO NOTHING;

-- Cliente sin cuenta: compró en la tienda física (RF-17)
INSERT INTO clientes.cliente (nombre, correo, tipo_cedula, cedula, direccion, num_compras) VALUES
    ('Comprador Presencial', 'presencial@correo.test', 'fisica', '2-2222-2222', NULL, 0)
ON CONFLICT DO NOTHING;

INSERT INTO clientes.cliente_telefono (cliente_id, telefono)
SELECT id, '8888-0000' FROM clientes.cliente WHERE correo = 'cliente@correo.test'
ON CONFLICT DO NOTHING;

INSERT INTO clientes.consentimiento_terminos (usuario_id, cliente_id, version_terminos, aceptado_en)
SELECT c.usuario_id, c.id, '1.0', TIMESTAMPTZ '2026-09-01 10:00-06'
FROM   clientes.cliente c
WHERE  c.correo = 'cliente@correo.test'
  AND  NOT EXISTS (SELECT 1 FROM clientes.consentimiento_terminos t WHERE t.cliente_id = c.id);
