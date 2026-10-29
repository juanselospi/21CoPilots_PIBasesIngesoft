-- Invariantes que deben cumplirse con cualquier contenido de la BD.
-- Con los datos de prueba cargados, verifican además que las semillas son coherentes.
-- Cruzan varias tablas, así que las garantiza el servicio y no un CHECK.

-- Un pedido nace de un carrito que se cerró al convertirse ("Convierte")
SELECT pg_temp.debe_cumplirse(
    'Todo pedido viene de un carrito convertido',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.pedido  pe
        JOIN   pedidos.carrito c ON c.correo_cliente = pe.correo_cliente
                                AND c.num_carrito    = pe.num_carrito
        WHERE  c.estado_carrito <> 'convertido'
    )
);

SELECT pg_temp.debe_cumplirse(
    'Todo pedido tiene al menos un producto',
    NOT EXISTS (
        SELECT 1 FROM pedidos.pedido pe
        WHERE  NOT EXISTS (SELECT 1 FROM pedidos.agrega a
                           WHERE a.correo_cliente = pe.correo_cliente
                             AND a.num_carrito    = pe.num_carrito)
    )
);

SELECT pg_temp.debe_cumplirse(
    'El historial de cada pedido empieza en colocado',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.historial_estado h
        WHERE  h.estado <> 'colocado'
          AND  h.fecha = (SELECT min(h2.fecha) FROM pedidos.historial_estado h2
                          WHERE  h2.correo_cliente = h.correo_cliente
                            AND  h2.num_carrito    = h.num_carrito)
    )
);

SELECT pg_temp.debe_cumplirse(
    'Ningún pedido tiene dos cambios de estado a la misma hora (el estado actual no es ambiguo)',
    NOT EXISTS (
        SELECT 1 FROM pedidos.historial_estado
        GROUP  BY correo_cliente, num_carrito, fecha HAVING count(*) > 1
    )
);

SELECT pg_temp.debe_cumplirse(
    'Solo se factura un pago aprobado',
    NOT EXISTS (
        SELECT 1
        FROM   facturacion.factura f
        JOIN   pagos.pago          p ON p.num_referencia = f.num_referencia
        WHERE  p.estado_pago <> 'aprobado'
    )
);
