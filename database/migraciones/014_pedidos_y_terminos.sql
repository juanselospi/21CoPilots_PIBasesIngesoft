-- =====================================================================
-- 014 — pedidos: estado «en disputa», canal y quién lo creó; términos
-- Historia/tarea: SCRUM-92
-- Justificación: modelo-datos.md § 4, C-18 y C-19
-- =====================================================================

-- «En disputa»: un pedido con un problema queda marcado hasta resolverlo y
-- queda en el historial (entrevista del 6/10, punto 1). Puede repetirse en un
-- mismo pedido gracias a la llave (estado, fecha) de la migración 010.
ALTER TABLE pedidos.historial_estado
    DROP CONSTRAINT ck_historial_estado,
    ADD CONSTRAINT ck_historial_estado
        CHECK (estado IN ('colocado', 'procesado', 'en_transito', 'finalizado',
                          'cancelado', 'en_disputa'));

-- Pedidos manuales (requerimientos-profesor.md § 3): por qué canal llegó,
-- qué administrador lo registró y, si es para otra persona, a nombre de quién.
-- Los pedidos que ya existían quedan como 'web'.
ALTER TABLE pedidos.pedido
    ADD COLUMN canal               VARCHAR(20)   NOT NULL DEFAULT 'web',
    ADD COLUMN creado_por          VARCHAR(255)
        REFERENCES admin.administrador (correo_usuario) ON UPDATE CASCADE,
    ADD COLUMN nombre_destinatario VARCHAR(150),
    ADD CONSTRAINT ck_pedido_canal
        CHECK (canal IN ('web', 'whatsapp', 'facebook', 'telefono', 'presencial')),
    ADD CONSTRAINT ck_pedido_destinatario
        CHECK (nombre_destinatario IS NULL OR btrim(nombre_destinatario) <> '');

CREATE INDEX ix_pedido_creado_por ON pedidos.pedido (creado_por);

-- RF-38, RNF-16: cuándo aceptó el cliente los términos y condiciones.
ALTER TABLE clientes.cliente
    ADD COLUMN fecha_aceptacion_terminos TIMESTAMPTZ;

-- reportes.v_estado_pedido ya ordena por fecha desde la migración 010
-- (numero_cambio ya no existe), así que no se toca.
