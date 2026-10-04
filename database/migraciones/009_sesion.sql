-- 009: crea la tabla SESION para controlar el inicio de sesión de los usuarios.

-- Guarda las sesiones asociadas a cada usuario.
-- Si el usuario se elimina, sus sesiones también se eliminan.
CREATE TABLE admin.sesion (
    correo_usuario     VARCHAR(255)  NOT NULL
        REFERENCES admin.usuario (correo) 
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
    ON admin.sesion (token_hash);
