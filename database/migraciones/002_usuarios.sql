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

-- Guarda las sesiones asociadas a cada usuario.
-- Si el usuario se elimina, sus sesiones también se eliminan.
CREATE TABLE usuarios.sesion (
    correo_usuario     VARCHAR(255)  NOT NULL
        REFERENCES usuarios.usuario (correo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

     -- Guarda el hash del token, no el token original de la cookie.
    token_hash         VARCHAR(128)  NOT NULL,
    fecha_creacion     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_vencimiento  TIMESTAMPTZ   NOT NULL,

    PRIMARY KEY (correo_usuario, token_hash),

    -- La sesión debe vencer después de haber sido creada.
    CONSTRAINT ck_sesion_vigencia
        CHECK (fecha_vencimiento > fecha_creacion)
);

-- Permite buscar una sesión directamente por el hash del token
-- y evita que el mismo token se repita.
CREATE UNIQUE INDEX ux_sesion_token
    ON usuarios.sesion (token_hash);
