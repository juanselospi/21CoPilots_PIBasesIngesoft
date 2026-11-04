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

-- Sprint 2 (migraciones 014 a 017)

-- Un cliente nunca registra su propio pedido como manual (C-18)
SELECT pg_temp.debe_cumplirse(
    'Un pedido en línea no tiene creador y uno manual sí',
    NOT EXISTS (
        SELECT 1 FROM pedidos.pedido
        WHERE  (canal = 'web') <> (creado_por IS NULL)
    )
);

-- RF-38: sin aceptar los términos no se puede comprar en línea
SELECT pg_temp.debe_cumplirse(
    'Todo pedido en línea es de un cliente que aceptó los términos antes de comprar',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.pedido   pe
        JOIN   clientes.cliente c ON c.correo_usuario = pe.correo_cliente
        WHERE  pe.canal = 'web'
          AND  (c.fecha_aceptacion_terminos IS NULL
                OR c.fecha_aceptacion_terminos > pe.fecha_pedido_realizado)
    )
);

-- RN-15: cancelado es un estado final
SELECT pg_temp.debe_cumplirse(
    'Un pedido cancelado no vuelve a cambiar de estado',
    NOT EXISTS (
        SELECT 1
        FROM   pedidos.historial_estado c
        JOIN   pedidos.historial_estado h ON h.correo_cliente = c.correo_cliente
                                         AND h.num_carrito    = c.num_carrito
                                         AND h.fecha          > c.fecha
        WHERE  c.estado = 'cancelado'
    )
);

-- C-21: el índice parcial impide dos propietarios; que haya uno lo garantiza el servicio
SELECT pg_temp.debe_cumplirse(
    'Si hay administradores, exactamente uno es el propietario',
    NOT EXISTS (SELECT 1 FROM admin.administrador)
    OR (SELECT count(*) = 1 FROM admin.administrador WHERE es_propietario)
);

-- C-22: el crédito sale de quitar productos de un pedido ya pagado
SELECT pg_temp.debe_cumplirse(
    'Un crédito que viene de un pedido es de un pedido con un pago aprobado',
    NOT EXISTS (
        SELECT 1 FROM clientes.credito cr
        WHERE  cr.num_carrito_pedido IS NOT NULL
          AND  NOT EXISTS (SELECT 1 FROM pagos.pago p
                           WHERE p.correo_cliente = cr.correo_cliente
                             AND p.num_carrito    = cr.num_carrito_pedido
                             AND p.estado_pago    = 'aprobado')
    )
);

SELECT pg_temp.debe_cumplirse(
    'Ningún cliente tiene saldo de crédito negativo',
    NOT EXISTS (SELECT 1 FROM reportes.v_saldo_credito WHERE saldo < 0)
);
