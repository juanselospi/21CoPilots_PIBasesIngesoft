-- =====================================================================
-- 009 — Módulo admin: SESION
--
-- Entidad agregada al EER para el inicio de sesión (RF-53):
--   SESION (PK/FK Correo_usuario → USUARIO.Correo, PK TokenHash,
--           FechaCreacion, FechaVencimiento)
--
-- Es entidad débil de Usuario: una sesión no existe sin su usuario y se
-- identifica por el usuario más su llave parcial (el hash del token). Se
-- guarda el hash SHA-256 del token; el token en claro solo viaja en la
-- cookie, así que filtrar esta tabla no expone sesiones (RNF-08).
-- =====================================================================

CREATE TABLE admin.sesion (
    correo_usuario     VARCHAR(255)  NOT NULL
        REFERENCES admin.usuario (correo) ON UPDATE CASCADE ON DELETE CASCADE,
    token_hash         VARCHAR(128)  NOT NULL,
    fecha_creacion     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_vencimiento  TIMESTAMPTZ   NOT NULL,
    PRIMARY KEY (correo_usuario, token_hash),
    CONSTRAINT ck_sesion_vigencia CHECK (fecha_vencimiento > fecha_creacion)
);
-- En cada petición la sesión se busca solo por el hash de la cookie; el
-- token es aleatorio de 256 bits, así que además es único en toda la tabla.
CREATE UNIQUE INDEX ux_sesion_token ON admin.sesion (token_hash);
