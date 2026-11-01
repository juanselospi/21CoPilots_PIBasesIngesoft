-- Datos de prueba: usuarios, administrador y clientes. SOLO para desarrollo local.
-- Contraseñas guardadas como hash bcrypt (compatible con bcrypt/bcryptjs en Node).
--   admin@dchobbies.test      / Admin123!
--   cliente@correo.test       / Cliente123!
--   presencial@correo.test    / Presencial123!

INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES
    ('admin@dchobbies.test',   crypt('Admin123!',      gen_salt('bf', 10)), 'Administración DC Hobbies'),
    ('cliente@correo.test',    crypt('Cliente123!',    gen_salt('bf', 10)), 'Cliente de Prueba'),
    ('presencial@correo.test', crypt('Presencial123!', gen_salt('bf', 10)), 'Comprador Presencial')
ON CONFLICT DO NOTHING;

INSERT INTO admin.administrador (correo_usuario) VALUES
    ('admin@dchobbies.test')
ON CONFLICT DO NOTHING;

-- fecha_aceptacion_terminos: cuándo aceptó los términos y condiciones (RF-38)
INSERT INTO clientes.cliente (correo_usuario, cedula, direccion, fecha_aceptacion_terminos) VALUES
    ('cliente@correo.test',    '1-1111-1111', 'San Pedro, Montes de Oca, San José', TIMESTAMPTZ '2026-09-01 10:00-06'),
    ('presencial@correo.test', '2-2222-2222', NULL,                                 TIMESTAMPTZ '2026-09-12 12:50-06')
ON CONFLICT DO NOTHING;

INSERT INTO clientes.cliente_telefono (correo_usuario, telefono) VALUES
    ('cliente@correo.test', '8888-0000'),
    ('cliente@correo.test', '2222-0000')
ON CONFLICT DO NOTHING;
