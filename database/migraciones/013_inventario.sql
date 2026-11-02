-- =====================================================================
-- 013 — inventario: tipo, costo y motivo de cada movimiento
-- Historia/tarea: SCRUM-91
-- Justificación: modelo-datos.md § 4, C-17
-- =====================================================================

-- Las ventas en línea no tienen administrador, así que correo_administrador
-- deja de ser obligatorio y no puede seguir en la llave primaria. La llave
-- pasa a (sku, fecha); clock_timestamp() da una hora distinta a cada
-- registro, aunque estén en la misma transacción.
ALTER TABLE inventario.producto_administra
    DROP CONSTRAINT producto_administra_pkey,
    ALTER COLUMN correo_administrador DROP NOT NULL,
    ALTER COLUMN fecha SET DEFAULT clock_timestamp(),
    ADD PRIMARY KEY (sku, fecha),

    -- Los registros que ya existían son ingresos de mercancía. El DEFAULT
    -- los llena sin un UPDATE, que el trigger de solo inserción rechazaría,
    -- y después se quita para que cada registro nuevo diga su tipo.
    ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'ingreso',
    ADD COLUMN costo_unitario NUMERIC(12,2),     -- RF-14: histórico de costos
    ADD COLUMN motivo TEXT,                      -- RF-20: justificación de un ajuste

    ADD CONSTRAINT ck_producto_administra_tipo
        CHECK (tipo IN ('ingreso', 'ajuste', 'venta_externa', 'venta_en_linea', 'reposicion')),
    ADD CONSTRAINT ck_producto_administra_costo
        CHECK (costo_unitario >= 0),
    ADD CONSTRAINT ck_producto_administra_motivo
        CHECK (tipo <> 'ajuste' OR btrim(coalesce(motivo, '')) <> ''),
    ADD CONSTRAINT ck_producto_administra_responsable
        CHECK (correo_administrador IS NOT NULL OR tipo IN ('venta_en_linea', 'reposicion'));

ALTER TABLE inventario.producto_administra
    ALTER COLUMN tipo DROP DEFAULT;

-- Las columnas nuevas van al final: CREATE OR REPLACE VIEW solo permite agregar
-- columnas después de las que ya tenía.
CREATE OR REPLACE VIEW reportes.v_registro_mercancia AS
SELECT pa.sku,
       p.nombre,
       pa.fecha,
       pa.cantidad,
       pa.correo_administrador,
       pa.tipo,
       pa.costo_unitario,
       pa.motivo
FROM   inventario.producto_administra pa
JOIN   catalogo.producto  p
       ON p.sku = pa.sku;
