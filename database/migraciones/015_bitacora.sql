-- =====================================================================
-- 015 — bitácora de auditoría
-- Historia/tarea: SCRUM-93
-- Justificación: modelo-datos.md § 4, C-20
-- =====================================================================

-- Cambios auditables y accesos denegados (RF-52, RNF-10). Solo se registran
-- acciones de usuarios con sesión: correo_usuario es obligatorio y forma parte
-- de la llave. clock_timestamp() da una hora distinta a cada registro, así que
-- dos registros del mismo usuario en una transacción no chocan.
-- Eventos que publica el servidor: parametro_modificado, acceso_denegado,
-- movimiento_registrado, pedido_confirmado, pedido_cancelado y
-- estado_pedido_cambiado.
CREATE TABLE admin.bitacora (
    correo_usuario  VARCHAR(255)  NOT NULL
        REFERENCES usuarios.usuario (correo) ON UPDATE CASCADE,
    fecha           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    evento          VARCHAR(40)   NOT NULL,
    entidad         VARCHAR(40),
    entidad_id      VARCHAR(100),
    valor_anterior  JSONB,
    valor_nuevo     JSONB,

    PRIMARY KEY (correo_usuario, fecha),

    CONSTRAINT ck_bitacora_evento
        CHECK (btrim(evento) <> '')
);

-- Historial de un registro concreto (por ejemplo, los cambios de un pedido)
CREATE INDEX ix_bitacora_entidad ON admin.bitacora (entidad, entidad_id);

-- Consultas por rango de fechas sin filtrar por usuario
CREATE INDEX ix_bitacora_fecha ON admin.bitacora (fecha);

-- La bitácora no se puede modificar ni eliminar una vez registrada.
CREATE TRIGGER tg_bitacora_solo_insercion
    BEFORE UPDATE OR DELETE ON admin.bitacora
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
