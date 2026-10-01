-- =====================================================================
-- 002 — Módulo admin: USUARIO y ADMINISTRADOR
--
-- Mapeo:
--   USUARIO       (PK Correo, Contraseña, Nombre)
--   ADMINISTRADOR (PK/FK Correo_usuario → USUARIO.Correo)
--
-- ADMINISTRADOR y CLIENTE son una especialización disjunta de USUARIO
-- (la "O" del EER). La disyunción se verifica en 003, cuando ya existe
-- clientes.cliente.
-- =====================================================================

-- RF-50, RF-53. El correo es la llave: se guarda normalizado (minúsculas y
-- sin espacios en los extremos) para que "Ana@x.com" y "ana@x.com " no sean
-- dos usuarios distintos.
CREATE TABLE admin.usuario (
    correo      VARCHAR(255)  PRIMARY KEY,
    contrasena  VARCHAR(255)  NOT NULL,   -- hash bcrypt, nunca texto plano (RNF-08)
    nombre      VARCHAR(150)  NOT NULL,
    CONSTRAINT ck_usuario_correo_normalizado CHECK (correo = lower(btrim(correo))),
    CONSTRAINT ck_usuario_correo             CHECK (correo LIKE '%_@_%'),
    CONSTRAINT ck_usuario_nombre             CHECK (btrim(nombre) <> '')
);

CREATE TABLE admin.administrador (
    correo_usuario  VARCHAR(255)  PRIMARY KEY
        REFERENCES admin.usuario (correo) ON UPDATE CASCADE ON DELETE CASCADE
);

-- RF-49: existe una única cuenta de administrador. La expresión constante
-- hace que toda fila choque con la anterior en el índice único.
CREATE UNIQUE INDEX ux_administrador_unico ON admin.administrador ((true));
