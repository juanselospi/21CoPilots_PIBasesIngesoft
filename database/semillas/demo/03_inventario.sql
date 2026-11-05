-- Datos de prueba: ingresos de mercancía. SOLO para desarrollo local.
-- Cada producto con existencias tiene su carga inicial, con su costo unitario
-- en dólares (RF-14). PKM-001 tiene un segundo ingreso más caro, para ver el
-- histórico de costos: su costo actual (item = 4.00) es el de la última compra.
-- Las familias nuevas (Funko Pop y Discos de vinilo) entraron en octubre.
-- Las ventas y reposiciones de los pedidos están en 04_pedidos.sql.

INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad, tipo, costo_unitario)
SELECT v.sku, 'admin@dchobbies.test', v.fecha, v.cantidad, 'ingreso', coalesce(v.costo, p.item)
FROM (VALUES
        ('PKM-001', TIMESTAMPTZ '2026-09-01 09:00-06', 40, 3.60),
        ('PKM-002', TIMESTAMPTZ '2026-09-01 09:00-06',  5, NULL),
        ('MTG-001', TIMESTAMPTZ '2026-09-01 09:00-06',  3, NULL),
        ('YGO-001', TIMESTAMPTZ '2026-09-01 09:00-06', 12, NULL),
        ('LIQ-001', TIMESTAMPTZ '2026-09-01 09:00-06',  6, NULL),
        ('ANI-001', TIMESTAMPTZ '2026-09-01 09:00-06',  2, NULL),
        ('JUG-001', TIMESTAMPTZ '2026-09-01 09:00-06',  3, NULL),
        ('JUG-002', TIMESTAMPTZ '2026-09-01 09:00-06', 10, NULL),
        ('VDJ-001', TIMESTAMPTZ '2026-09-01 09:00-06',  7, NULL),
        ('VDJ-002', TIMESTAMPTZ '2026-09-01 09:00-06',  6, NULL),
        ('PKM-001', TIMESTAMPTZ '2026-09-15 14:30-06', 10, 4.00),   -- segundo ingreso, más caro
        ('FUN-001', TIMESTAMPTZ '2026-10-22 10:00-06',  2, NULL),
        ('FUN-002', TIMESTAMPTZ '2026-10-22 10:00-06',  6, NULL),
        ('FUN-004', TIMESTAMPTZ '2026-10-22 10:00-06',  8, NULL),
        ('FUN-005', TIMESTAMPTZ '2026-10-22 10:00-06',  5, NULL),
        ('VIN-001', TIMESTAMPTZ '2026-10-22 10:30-06',  5, NULL),
        ('VIN-002', TIMESTAMPTZ '2026-10-22 10:30-06',  3, NULL),
        ('VIN-003', TIMESTAMPTZ '2026-10-22 10:30-06',  2, NULL),
        ('VIN-004', TIMESTAMPTZ '2026-10-22 10:30-06',  4, NULL)
     ) AS v(sku, fecha, cantidad, costo)
JOIN catalogo.producto p ON p.sku = v.sku
ON CONFLICT DO NOTHING;
