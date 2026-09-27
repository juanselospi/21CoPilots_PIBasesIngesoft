-- Invariantes que deben cumplirse con cualquier contenido de la BD.
-- Con los datos de prueba cargados, verifican además que las semillas son coherentes.

-- RES-07, RF-15: el saldo de cada producto es la suma de sus movimientos.
-- Si esto falla, alguien cambió existencias sin registrar el movimiento.
SELECT pg_temp.debe_cumplirse(
    'Las existencias coinciden con la suma de los movimientos (RF-15)',
    NOT EXISTS (
        SELECT 1
        FROM   catalogo.producto p
        LEFT   JOIN inventario.existencia e ON e.producto_id = p.id
        LEFT   JOIN (SELECT producto_id, sum(cantidad) AS total
                     FROM   inventario.movimiento
                     GROUP  BY producto_id) m ON m.producto_id = p.id
        WHERE  coalesce(e.cantidad, 0) <> coalesce(m.total, 0)
    )
);

-- Todo producto tiene su fila de existencias (la crea el servicio al crear el producto)
SELECT pg_temp.debe_cumplirse(
    'Todo producto tiene fila de existencias',
    NOT EXISTS (
        SELECT 1 FROM catalogo.producto p
        WHERE  NOT EXISTS (SELECT 1 FROM inventario.existencia e WHERE e.producto_id = p.id)
    )
);

-- El estado vigente de cada pedido coincide con su último registro de historial
SELECT pg_temp.debe_cumplirse(
    'El estado de cada pedido coincide con su último cambio registrado (RF-26)',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.pedido pe
        JOIN   LATERAL (SELECT h.estado
                        FROM   pedidos.historial_estado h
                        WHERE  h.pedido_id = pe.id
                        ORDER  BY h.registrado_en DESC, h.id DESC
                        LIMIT  1) ultimo ON TRUE
        WHERE  ultimo.estado <> pe.estado
    )
);

-- La escala de niveles tiene un nivel de entrada con 0 compras (RN-08)
SELECT pg_temp.debe_cumplirse(
    'Existe un nivel de fidelidad para clientes sin compras (RN-08)',
    NOT EXISTS (SELECT 1 FROM clientes.nivel_fidelidad)
    OR EXISTS (SELECT 1 FROM clientes.nivel_fidelidad WHERE compras_minimas = 0)
);
