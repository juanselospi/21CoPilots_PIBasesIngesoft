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
    'El historial de cada pedido empieza en colocado y no tiene huecos',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.historial_estado h
        GROUP  BY h.correo_cliente, h.num_carrito
        HAVING max(h.numero_cambio) <> count(*)
            OR bool_or(h.numero_cambio = 1 AND h.estado <> 'colocado')
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
