-- 002: crea las tablas USUARIO y SESION.

-- Guarda la información común de cualquier usuario del sistema.
-- El correo se almacena en minúsculas y sin espacios para evitar duplicados.
CREATE TABLE usuarios.usuario (
    correo      VARCHAR(255)  PRIMARY KEY,
    contrasena  VARCHAR(255)  NOT NULL,    -- Se guarda el hash, no la contraseña original.
    nombre      VARCHAR(150)  NOT NULL,
    
    CONSTRAINT ck_usuario_correo_normalizado 
        CHECK (correo = lower(btrim(correo))),
    CONSTRAINT ck_usuario_correo             
        CHECK (correo LIKE '%_@_%'),
    CONSTRAINT ck_usuario_nombre             
        CHECK (btrim(nombre) <> '')
);

-- Sesiones de cada usuario; se borran junto con él.
CREATE TABLE usuarios.sesion (
    correo_usuario     VARCHAR(255)  NOT NULL
        REFERENCES usuarios.usuario (correo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    -- Hash del token, no el token de la cookie.
    token_hash         VARCHAR(128)  NOT NULL,
    fecha_creacion     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_vencimiento  TIMESTAMPTZ   NOT NULL,

    PRIMARY KEY (correo_usuario, token_hash),

    CONSTRAINT ck_sesion_vigencia
        CHECK (fecha_vencimiento > fecha_creacion)
);

-- Busca la sesión por token y evita que un mismo hash se repita.
CREATE UNIQUE INDEX ux_sesion_token
    ON usuarios.sesion (token_hash);
