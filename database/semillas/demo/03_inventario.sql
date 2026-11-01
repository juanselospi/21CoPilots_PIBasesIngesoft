-- Datos de prueba: registro de mercancía del administrador. SOLO para desarrollo local.
-- Cada producto con existencias tiene su carga inicial; PKM-001 tiene además
-- un segundo ingreso. FUN-001 queda en 2 unidades para probar la alerta de
-- existencias bajas. Cada ingreso guarda su costo unitario (RF-14): el
-- segundo ingreso de PKM-001 llegó más caro, para ver el histórico de costos.

INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad, tipo, costo_unitario)
SELECT v.sku, 'admin@dchobbies.test', TIMESTAMPTZ '2026-09-01 09:00-06', v.cantidad, 'ingreso', p.item
FROM (VALUES
        ('PKM-001', 40), ('PKM-002', 5), ('MTG-001', 3), ('YGO-001', 12), ('LIQ-001', 6),
        ('FUN-001', 2),  ('FUN-002', 4), ('ANI-001', 2), ('JUG-001', 3),  ('JUG-002', 10),
        ('VDJ-001', 7),  ('VDJ-002', 5)
     ) AS v(sku, cantidad)
JOIN catalogo.producto p ON p.sku = v.sku
ON CONFLICT DO NOTHING;

-- Segundo ingreso de PKM-001
INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad, tipo, costo_unitario) VALUES
    ('PKM-001', 'admin@dchobbies.test', TIMESTAMPTZ '2026-09-15 14:30-06', 10, 'ingreso', 2700)
ON CONFLICT DO NOTHING;
