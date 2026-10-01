-- Datos de prueba: una oferta, un pedido en línea pagado y facturado, una
-- venta presencial y un carrito activo. SOLO para desarrollo local. Sirven
-- para ver los reportes (EP-06) con datos.
-- Los precios unitarios siguen la fórmula de documentos/diseño/formula-precio.md
-- (item + importación %, + margen %) y se guardan sin impuesto; en ejecución
-- los calcula el motor de precios.

INSERT INTO pedidos.oferta (codigo_oferta, nombre, descripcion, fecha_inicio, fecha_fin,
                            porcentaje_descuento, monto_minimo, nivel_fidelidad_minimo) VALUES
    ('BIENVENIDA10', 'Bienvenida', '10 % en compras desde ₡20 000.',
     DATE '2026-09-01', DATE '2026-12-31', 10, 20000, 1)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    -- Idempotente: si ya hay pedidos, no se vuelven a crear
    IF EXISTS (SELECT 1 FROM pedidos.pedido) THEN
        RETURN;
    END IF;

    -- 1) Pedido en línea: 2 sobres Pokémon y 1 Yu-Gi-Oh!, entregado.
    --    Subtotal ₡18 000 + 13 % (₡2 340) + envío ₡2 500 = ₡22 840
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('cliente@correo.test', 1, 'convertido',
            TIMESTAMPTZ '2026-09-09 20:00-06', TIMESTAMPTZ '2026-09-10 11:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada) VALUES
        ('cliente@correo.test', 1, 'PKM-001', 2,  3750.00, 13),
        ('cliente@correo.test', 1, 'YGO-001', 1, 10500.00, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado, fecha_entrega,
                                modalidad_entrega, direccion, costo_entrega)
    VALUES ('cliente@correo.test', 1, TIMESTAMPTZ '2026-09-10 11:00-06', TIMESTAMPTZ '2026-09-13 16:00-06',
            'correos_cr', 'San Pedro, Montes de Oca, San José', 2500.00);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, numero_cambio, estado, fecha) VALUES
        ('cliente@correo.test', 1, 1, 'colocado',    TIMESTAMPTZ '2026-09-10 11:00-06'),
        ('cliente@correo.test', 1, 2, 'procesado',   TIMESTAMPTZ '2026-09-10 15:00-06'),
        ('cliente@correo.test', 1, 3, 'en_transito', TIMESTAMPTZ '2026-09-11 09:00-06'),
        ('cliente@correo.test', 1, 4, 'finalizado',  TIMESTAMPTZ '2026-09-13 16:00-06');

    -- Un primer intento rechazado y el cobro aprobado ("Necesita", 1 a N)
    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito) VALUES
        ('SIM-0001', TIMESTAMPTZ '2026-09-10 10:58-06', 22840.00, 'tarjeta', 'rechazado', 'cliente@correo.test', 1),
        ('SIM-0002', TIMESTAMPTZ '2026-09-10 11:00-06', 22840.00, 'tarjeta', 'aprobado',  'cliente@correo.test', 1);

    INSERT INTO facturacion.factura (num_factura, fecha_emision, num_referencia)
    VALUES ('SIM-FE-0001', TIMESTAMPTZ '2026-09-10 11:01-06', 'SIM-0002');

    UPDATE clientes.cliente SET num_compras = num_compras + 1
    WHERE  correo_usuario = 'cliente@correo.test';

    -- 2) Venta presencial con entrega personal (RF-17).
    --    Subtotal ₡11 960 + 13 % (₡1 554,80) = ₡13 514,80
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('presencial@correo.test', 1, 'convertido',
            TIMESTAMPTZ '2026-09-12 12:55-06', TIMESTAMPTZ '2026-09-12 13:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES ('presencial@correo.test', 1, 'JUG-002', 1, 11960.00, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado, fecha_entrega,
                                modalidad_entrega, costo_entrega)
    VALUES ('presencial@correo.test', 1, TIMESTAMPTZ '2026-09-12 13:00-06', TIMESTAMPTZ '2026-09-12 13:00-06',
            'entrega_personal', 0);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, numero_cambio, estado, fecha) VALUES
        ('presencial@correo.test', 1, 1, 'colocado',   TIMESTAMPTZ '2026-09-12 13:00-06'),
        ('presencial@correo.test', 1, 2, 'finalizado', TIMESTAMPTZ '2026-09-12 13:00-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('SIM-0003', TIMESTAMPTZ '2026-09-12 13:00-06', 13514.80, 'efectivo', 'aprobado',
            'presencial@correo.test', 1);

    INSERT INTO facturacion.factura (num_factura, fecha_emision, num_referencia)
    VALUES ('SIM-FE-0002', TIMESTAMPTZ '2026-09-12 13:01-06', 'SIM-0003');

    UPDATE clientes.cliente SET num_compras = num_compras + 1
    WHERE  correo_usuario = 'presencial@correo.test';

    -- 3) Carrito activo del cliente en línea, todavía sin pedido (RN-14)
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
    VALUES ('cliente@correo.test', 2);

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES ('cliente@correo.test', 2, 'FUN-001', 1, 13972.50, 13);
END;
$$;
