-- =====================================================================
-- 021 — enlaces para recuperar la contraseña
-- Historia/tarea: SCRUM-117
-- Justificación: modelo-datos.md § 4, C-26
-- =====================================================================

-- RF-54: cada enlace lleva un token aleatorio y aquí se guarda solo su hash,
-- igual que en usuarios.sesion. Sirve una vez (fecha_uso) y vence. Se
-- guardan aparte para no tocar la tabla de usuarios y para que quede
-- registro de cuándo se pidió y se usó cada uno.
CREATE TABLE usuarios.recuperacion (
    token_hash         VARCHAR(128)  PRIMARY KEY,
    correo_usuario     VARCHAR(255)  NOT NULL
        REFERENCES usuarios.usuario (correo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    fecha_creacion     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_vencimiento  TIMESTAMPTZ   NOT NULL,
    fecha_uso          TIMESTAMPTZ,

    CONSTRAINT ck_recuperacion_vigencia
        CHECK (fecha_vencimiento > fecha_creacion),
    CONSTRAINT ck_recuperacion_uso
        CHECK (fecha_uso IS NULL OR fecha_uso >= fecha_creacion)
);

CREATE INDEX ix_recuperacion_usuario ON usuarios.recuperacion (correo_usuario);
