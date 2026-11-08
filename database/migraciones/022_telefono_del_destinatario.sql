-- =====================================================================
-- 022 — teléfono de quien recibe un pedido manual
-- Historia/tarea: SCRUM-144
-- Justificación: modelo-datos.md § 4, C-26
-- =====================================================================

-- Quien compra sin cuenta queda a nombre de la cuenta de la migración 020,
-- que no tiene sus datos: el teléfono para contactarlo se guarda en el pedido,
-- igual que su nombre. Es opcional, y solo se usa en los pedidos manuales.
ALTER TABLE pedidos.pedido
    ADD COLUMN telefono_destinatario VARCHAR(20),
    ADD CONSTRAINT ck_pedido_telefono_destinatario
        CHECK (telefono_destinatario IS NULL OR btrim(telefono_destinatario) <> '');
