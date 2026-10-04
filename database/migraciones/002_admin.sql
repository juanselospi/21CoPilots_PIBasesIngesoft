-- 002: Crea las tablas USUARIO y ADMINISTRADOR.

-- Guarda la información común de cualquier usuario del sistema.
-- El correo se almacena en minúsculas y sin espacios para evitar duplicados.
CREATE TABLE admin.usuario (
    correo      VARCHAR(255)  PRIMARY KEY,
    contrasena  VARCHAR(255)  NOT NULL,    -- Se guarda el hash, no la contraseña original.
    nombre      VARCHAR(150)  NOT NULL,
    CONSTRAINT ck_usuario_correo_normalizado CHECK (correo = lower(btrim(correo))),
    CONSTRAINT ck_usuario_correo             CHECK (correo LIKE '%_@_%'),
    CONSTRAINT ck_usuario_nombre             CHECK (btrim(nombre) <> '')
);

-- Un administrador primero debe existir como usuario.
CREATE TABLE admin.administrador (
    correo_usuario  VARCHAR(255)  PRIMARY KEY
        REFERENCES admin.usuario (correo) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Solo puede existir una cuenta de administrador.
CREATE UNIQUE INDEX ux_administrador_unico ON admin.administrador ((true));
