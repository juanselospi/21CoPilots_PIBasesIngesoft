-- Datos de prueba: existencias iniciales. SOLO para desarrollo local.
-- Cada producto con existencias tiene su movimiento de carga inicial con el
-- costo de compra, igual que dejaría la importación del Excel (RF-57).
-- PKM-001 tiene además un segundo ingreso a otro costo, para probar el
-- histórico de costos (RN-06, RF-14).
-- FUN-001 queda en 2 unidades para probar la alerta de existencias bajas (RF-16).

WITH iniciales (sku, cantidad) AS (
    VALUES
    ('PKM-001', 40), ('PKM-002', 5), ('MTG-001', 3), ('MTG-002', 0), ('YGO-001', 12),
    ('LIQ-001', 6),  ('FUN-001', 2), ('FUN-002', 4), ('FUN-003', 0), ('ANI-001', 2),
    ('JUG-001', 3),  ('JUG-002', 10), ('VDJ-001', 7), ('VDJ-002', 5), ('VDJ-003', 2)
),
movimientos AS (
    INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, costo_unitario, responsable_id, registrado_en)
    SELECT p.id, 'carga_inicial', i.cantidad, p.costo_item,
           (SELECT id FROM admin.usuario WHERE correo = 'admin@dchobbies.test'),
           TIMESTAMPTZ '2026-09-01 09:00-06'
    FROM   iniciales i
    JOIN   catalogo.producto p ON p.sku = i.sku
    WHERE  i.cantidad > 0
      AND  NOT EXISTS (SELECT 1 FROM inventario.movimiento m
                       WHERE m.producto_id = p.id AND m.tipo = 'carga_inicial')
    RETURNING producto_id
)
INSERT INTO inventario.existencia (producto_id, cantidad)
SELECT p.id, i.cantidad
FROM   iniciales i
JOIN   catalogo.producto p ON p.sku = i.sku
ON CONFLICT (producto_id) DO NOTHING;

-- Segundo ingreso de PKM-001 a un costo distinto (RN-06)
DO $$
DECLARE
    v_producto BIGINT := (SELECT id FROM catalogo.producto WHERE sku = 'PKM-001');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM inventario.movimiento
                   WHERE producto_id = v_producto AND tipo = 'ingreso') THEN
        INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, costo_unitario, responsable_id, registrado_en)
        VALUES (v_producto, 'ingreso', 10, 2700,
                (SELECT id FROM admin.usuario WHERE correo = 'admin@dchobbies.test'),
                TIMESTAMPTZ '2026-09-15 14:30-06');
        UPDATE inventario.existencia SET cantidad = cantidad + 10 WHERE producto_id = v_producto;
    END IF;
END;
$$;
