-- =====================================================================
-- 016 — administradores: varias cuentas y un solo propietario
-- Historia/tarea: SCRUM-94
-- Justificación: modelo-datos.md § 4, C-21
-- =====================================================================

-- Un empleado es otra cuenta de administrador, así que ya puede haber varias.
-- Sigue habiendo un solo dueño (RF-49): ahora lo garantiza el índice parcial.
DROP INDEX admin.ux_administrador_unico;

ALTER TABLE admin.administrador
    ADD COLUMN es_propietario BOOLEAN NOT NULL DEFAULT false,
    -- Quién creó la cuenta; el propietario no tiene creador
    ADD COLUMN creado_por VARCHAR(255)
        REFERENCES admin.administrador (correo_usuario) ON UPDATE CASCADE,
    -- Una cuenta desactivada no se borra, para no perder quién hizo qué
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true,

    ADD CONSTRAINT ck_administrador_creador
        CHECK (creado_por <> correo_usuario),
    ADD CONSTRAINT ck_administrador_propietario_activo
        CHECK (activo OR NOT es_propietario);

CREATE UNIQUE INDEX ux_administrador_propietario
    ON admin.administrador (es_propietario) WHERE es_propietario;

CREATE INDEX ix_administrador_creado_por ON admin.administrador (creado_por);

-- Hasta ahora solo podía haber un administrador: si existe, es el propietario.
UPDATE admin.administrador SET es_propietario = true;
