-- =====================================================================
-- 010 — alinear con el EER
-- Historia/tarea: SCRUM-88
-- Justificación: modelo-datos.md § 4, C-23
-- =====================================================================

-- La especialización de Usuario es traslapada: una cuenta puede ser
-- administrador y cliente a la vez.
DROP TRIGGER tg_administrador_disjunto ON admin.administrador;
DROP TRIGGER tg_cliente_disjunto ON clientes.cliente;
DROP FUNCTION public.verificar_usuario_disjunto();

-- El historial solo tiene estado y fecha, con llave parcial (estado, fecha):
-- un pedido puede volver a un estado, por ejemplo «en disputa».
-- La vista se reescribe antes de quitar la columna que usaba.
CREATE OR REPLACE VIEW reportes.v_estado_pedido AS
SELECT DISTINCT ON (h.correo_cliente, h.num_carrito)
       h.correo_cliente,
       h.num_carrito,
       h.estado,
       h.fecha AS fecha_estado
FROM   pedidos.historial_estado h
ORDER  BY h.correo_cliente, h.num_carrito, h.fecha DESC;

ALTER TABLE pedidos.historial_estado
    DROP CONSTRAINT historial_estado_pkey,
    DROP CONSTRAINT ck_historial_numero,
    DROP COLUMN numero_cambio,
    ADD PRIMARY KEY (correo_cliente, num_carrito, estado, fecha),
    -- now() da la misma hora en toda una transacción; clock_timestamp() no,
    -- así dos cambios en una transacción no chocan y el orden por fecha sirve
    ALTER COLUMN fecha SET DEFAULT clock_timestamp();
