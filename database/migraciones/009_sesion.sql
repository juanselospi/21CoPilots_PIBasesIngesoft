-- =====================================================================
-- 009 — sesion
-- Historia/tarea: SCRUM-9 (endpoint de login)
-- Justificación: modelo-datos.md § 4, M-16
-- =====================================================================

-- RF-53: sesión iniciada. Se guarda el hash del token; el token en claro
-- solo viaja en la cookie.
CREATE TABLE admin.sesion (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES admin.usuario (id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    vence_en    TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_sesion_vigencia CHECK (vence_en > creado_en)
);
CREATE INDEX ix_sesion_usuario ON admin.sesion (usuario_id);
