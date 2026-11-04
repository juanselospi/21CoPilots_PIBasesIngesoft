-- Datos de prueba: tarifas de envío, una oferta, pedidos en varios estados y
-- canales con sus pagos, un crédito a favor y un carrito activo, para ver los
-- reportes y el panel con datos. SOLO para desarrollo local.
-- Montos en dólares. Los precios unitarios se guardan sin impuesto, como los
-- congela el servidor al confirmar; el total del pago es la suma de cada línea
-- con impuesto (redondeada) más el envío.
--
--   Cliente                  Carrito  Canal       Estado actual  Pago
--   cliente@correo.test      1        web         finalizado     tarjeta (1 rechazado, 1 aprobado)
--   presencial@correo.test   1        presencial  finalizado     efectivo
--   cliente@correo.test      2        web         cancelado      tarjeta → crédito a favor
--   cliente@correo.test      3        web         en_disputa     tarjeta
--   presencial@correo.test   2        whatsapp    en_transito    SINPE Móvil (lo registró el empleado)
--   cliente@correo.test      4        web         colocado       contra entrega (pendiente)
--   cliente@correo.test      5        —           carrito activo, sin pedido

-- Montos de prueba de las tarifas (018 las crea en 0). Solo se llenan las que
-- siguen en 0, para no pisar los montos reales cuando el cliente los defina.
UPDATE pedidos.tarifa_envio t
SET    monto = v.monto
FROM   (VALUES ('mensajero', 3.50), ('uber_flash', 5.00), ('correos_cr', 4.00)) AS v(modalidad, monto)
WHERE  t.modalidad = v.modalidad
  AND  t.monto = 0;

INSERT INTO pedidos.oferta (codigo_oferta, nombre, descripcion, fecha_inicio, fecha_fin,
                            porcentaje_descuento, monto_minimo, nivel_fidelidad_minimo) VALUES
    ('BIENVENIDA10', 'Bienvenida', '10 % en compras desde $40.',
     DATE '2026-09-01', DATE '2026-12-31', 10, 40, 1)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    -- Idempotente: si ya hay pedidos, no se vuelven a crear
    IF EXISTS (SELECT 1 FROM pedidos.pedido) THEN
        RETURN;
    END IF;

    -- 1) Pedido en línea entregado: 2 sobres Pokémon y 1 Yu-Gi-Oh!.
    --    6.78 × 2 + 20.34 = 33.90 con impuesto (subtotal 30.00) + envío 4.00 = 37.90
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('cliente@correo.test', 1, 'convertido',
            TIMESTAMPTZ '2026-09-09 20:00-06', TIMESTAMPTZ '2026-09-10 11:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada) VALUES
        ('cliente@correo.test', 1, 'PKM-001', 2,  6.00, 13),
        ('cliente@correo.test', 1, 'YGO-001', 1, 18.00, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado, fecha_entrega,
                                modalidad_entrega, direccion, costo_entrega)
    VALUES ('cliente@correo.test', 1, TIMESTAMPTZ '2026-09-10 11:00-06', TIMESTAMPTZ '2026-09-13 16:00-06',
            'correos_cr', 'San Pedro, Montes de Oca, San José', 4.00);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha) VALUES
        ('cliente@correo.test', 1, 'colocado',    TIMESTAMPTZ '2026-09-10 11:00-06'),
        ('cliente@correo.test', 1, 'procesado',   TIMESTAMPTZ '2026-09-10 15:00-06'),
        ('cliente@correo.test', 1, 'en_transito', TIMESTAMPTZ '2026-09-11 09:00-06'),
        ('cliente@correo.test', 1, 'finalizado',  TIMESTAMPTZ '2026-09-13 16:00-06');

    -- Un primer intento rechazado y luego el cobro aprobado
    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito) VALUES
        ('SIM-0001', TIMESTAMPTZ '2026-09-10 10:58-06', 37.90, 'tarjeta', 'rechazado', 'cliente@correo.test', 1),
        ('SIM-0002', TIMESTAMPTZ '2026-09-10 11:00-06', 37.90, 'tarjeta', 'aprobado',  'cliente@correo.test', 1);

    -- 2) Venta presencial con entrega personal, registrada por el administrador (014).
    --    27.03 con impuesto (subtotal 23.92), sin envío
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('presencial@correo.test', 1, 'convertido',
            TIMESTAMPTZ '2026-09-12 12:55-06', TIMESTAMPTZ '2026-09-12 13:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES ('presencial@correo.test', 1, 'JUG-002', 1, 23.92, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado, fecha_entrega,
                                modalidad_entrega, costo_entrega, canal, creado_por)
    VALUES ('presencial@correo.test', 1, TIMESTAMPTZ '2026-09-12 13:00-06', TIMESTAMPTZ '2026-09-12 13:00-06',
            'entrega_personal', 0, 'presencial', 'admin@dchobbies.test');

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha) VALUES
        ('presencial@correo.test', 1, 'colocado',   TIMESTAMPTZ '2026-09-12 13:00-06'),
        ('presencial@correo.test', 1, 'finalizado', TIMESTAMPTZ '2026-09-12 13:05-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('SIM-0003', TIMESTAMPTZ '2026-09-12 13:00-06', 27.03, 'efectivo', 'aprobado',
            'presencial@correo.test', 1);

    -- 3) Pedido en línea pagado y cancelado por el administrador: no se devuelve
    --    dinero, se otorga un crédito a favor por lo pagado (C-22) y el
    --    inventario se repone (requerimientos-profesor.md § 5 y § 6).
    --    70.51 + 6.78 × 3 = 90.85 con impuesto (subtotal 80.40) + envío 3.50 = 94.35
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('cliente@correo.test', 2, 'convertido',
            TIMESTAMPTZ '2026-10-15 09:40-06', TIMESTAMPTZ '2026-10-15 10:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada) VALUES
        ('cliente@correo.test', 2, 'MTG-001', 1, 62.40, 13),
        ('cliente@correo.test', 2, 'PKM-001', 3,  6.00, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado,
                                modalidad_entrega, direccion, costo_entrega)
    VALUES ('cliente@correo.test', 2, TIMESTAMPTZ '2026-10-15 10:00-06',
            'mensajero', 'San Pedro, Montes de Oca, San José', 3.50);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha) VALUES
        ('cliente@correo.test', 2, 'colocado',  TIMESTAMPTZ '2026-10-15 10:00-06'),
        ('cliente@correo.test', 2, 'cancelado', TIMESTAMPTZ '2026-10-16 09:00-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('SIM-0004', TIMESTAMPTZ '2026-10-15 10:00-06', 94.35, 'tarjeta', 'aprobado',
            'cliente@correo.test', 2);

    INSERT INTO clientes.credito (correo_cliente, fecha, monto, motivo, num_carrito_pedido)
    VALUES ('cliente@correo.test', TIMESTAMPTZ '2026-10-16 09:00-06', 94.35,
            'Pedido cancelado por la tienda: se otorga crédito por lo pagado', 2);

    -- 4) Pedido en línea en disputa: el control llegó dañado.
    --    89.50 con impuesto (subtotal 79.20) + envío 4.00 = 93.50
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('cliente@correo.test', 3, 'convertido',
            TIMESTAMPTZ '2026-10-25 18:45-06', TIMESTAMPTZ '2026-10-25 19:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES ('cliente@correo.test', 3, 'VDJ-002', 1, 79.20, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado,
                                modalidad_entrega, direccion, costo_entrega)
    VALUES ('cliente@correo.test', 3, TIMESTAMPTZ '2026-10-25 19:00-06',
            'correos_cr', 'San Pedro, Montes de Oca, San José', 4.00);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha) VALUES
        ('cliente@correo.test', 3, 'colocado',    TIMESTAMPTZ '2026-10-25 19:00-06'),
        ('cliente@correo.test', 3, 'procesado',   TIMESTAMPTZ '2026-10-26 09:00-06'),
        ('cliente@correo.test', 3, 'en_transito', TIMESTAMPTZ '2026-10-27 08:00-06'),
        ('cliente@correo.test', 3, 'en_disputa',  TIMESTAMPTZ '2026-10-29 15:00-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('SIM-0005', TIMESTAMPTZ '2026-10-25 19:00-06', 93.50, 'tarjeta', 'aprobado',
            'cliente@correo.test', 3);

    -- 5) Pedido manual por WhatsApp, registrado por el empleado y a nombre de
    --    otra persona (C-18). 16.37 × 2 = 32.75 + 61.02 = 93.77 con impuesto
    --    (subtotal 82.98) + envío 5.00 = 98.77
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('presencial@correo.test', 2, 'convertido',
            TIMESTAMPTZ '2026-10-28 15:50-06', TIMESTAMPTZ '2026-10-28 16:00-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada) VALUES
        ('presencial@correo.test', 2, 'FUN-004', 2, 14.49, 13),
        ('presencial@correo.test', 2, 'VIN-004', 1, 54.00, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado,
                                modalidad_entrega, direccion, costo_entrega,
                                canal, creado_por, nombre_destinatario)
    VALUES ('presencial@correo.test', 2, TIMESTAMPTZ '2026-10-28 16:00-06',
            'uber_flash', 'Barrio Escalante, San José', 5.00,
            'whatsapp', 'empleado@dchobbies.test', 'María Solís');

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha) VALUES
        ('presencial@correo.test', 2, 'colocado',    TIMESTAMPTZ '2026-10-28 16:00-06'),
        ('presencial@correo.test', 2, 'procesado',   TIMESTAMPTZ '2026-10-29 10:00-06'),
        ('presencial@correo.test', 2, 'en_transito', TIMESTAMPTZ '2026-10-30 09:00-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('SIM-0006', TIMESTAMPTZ '2026-10-28 16:00-06', 98.77, 'sinpe_movil', 'aprobado',
            'presencial@correo.test', 2);

    -- 6) Pedido en línea recién colocado, contra entrega: el pago queda
    --    pendiente con una referencia local, y la factura se emite al cobrar.
    --    32.75 + 55.09 = 87.84 con impuesto (subtotal 77.73) + envío 3.50 = 91.34
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_creacion, fecha_cierre)
    VALUES ('cliente@correo.test', 4, 'convertido',
            TIMESTAMPTZ '2026-11-01 18:10-06', TIMESTAMPTZ '2026-11-01 18:30-06');

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada) VALUES
        ('cliente@correo.test', 4, 'FUN-002', 2, 14.49, 13),
        ('cliente@correo.test', 4, 'VIN-001', 1, 48.75, 13);

    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, fecha_pedido_realizado,
                                modalidad_entrega, direccion, costo_entrega)
    VALUES ('cliente@correo.test', 4, TIMESTAMPTZ '2026-11-01 18:30-06',
            'mensajero', 'San Pedro, Montes de Oca, San José', 3.50);

    INSERT INTO pedidos.historial_estado (correo_cliente, num_carrito, estado, fecha)
    VALUES ('cliente@correo.test', 4, 'colocado', TIMESTAMPTZ '2026-11-01 18:30-06');

    INSERT INTO pagos.pago (num_referencia, fecha, monto, metodo_pago, estado_pago,
                            correo_cliente, num_carrito)
    VALUES ('LOCAL-3f2b8c1e-5a4d-4e7b-9c0a-1d2e3f4a5b6c', TIMESTAMPTZ '2026-11-01 18:30-06', 91.34,
            'contra_entrega', 'pendiente', 'cliente@correo.test', 4);

    -- Facturas de los pagos aprobados, con el consecutivo de la facturación simulada
    INSERT INTO facturacion.factura (num_factura, fecha_emision, num_referencia)
    SELECT 'FAC-' || num_referencia, fecha + INTERVAL '1 minute', num_referencia
    FROM   pagos.pago
    WHERE  estado_pago = 'aprobado';

    -- Salidas de inventario de cada pedido: venta en línea (sin administrador)
    -- o venta externa (la registra quien tomó el pedido), y la reposición del
    -- pedido cancelado (013, C-17)
    INSERT INTO inventario.producto_administra (sku, correo_administrador, fecha, cantidad, tipo) VALUES
        ('PKM-001', NULL,                      TIMESTAMPTZ '2026-09-10 11:00-06', -2, 'venta_en_linea'),
        ('YGO-001', NULL,                      TIMESTAMPTZ '2026-09-10 11:00-06', -1, 'venta_en_linea'),
        ('JUG-002', 'admin@dchobbies.test',    TIMESTAMPTZ '2026-09-12 13:00-06', -1, 'venta_externa'),
        ('MTG-001', NULL,                      TIMESTAMPTZ '2026-10-15 10:00-06', -1, 'venta_en_linea'),
        ('PKM-001', NULL,                      TIMESTAMPTZ '2026-10-15 10:00-06', -3, 'venta_en_linea'),
        ('MTG-001', 'admin@dchobbies.test',    TIMESTAMPTZ '2026-10-16 09:00-06',  1, 'reposicion'),
        ('PKM-001', 'admin@dchobbies.test',    TIMESTAMPTZ '2026-10-16 09:00-06',  3, 'reposicion'),
        ('VDJ-002', NULL,                      TIMESTAMPTZ '2026-10-25 19:00-06', -1, 'venta_en_linea'),
        ('FUN-004', 'empleado@dchobbies.test', TIMESTAMPTZ '2026-10-28 16:00-06', -2, 'venta_externa'),
        ('VIN-004', 'empleado@dchobbies.test', TIMESTAMPTZ '2026-10-28 16:00-06', -1, 'venta_externa'),
        ('FUN-002', NULL,                      TIMESTAMPTZ '2026-11-01 18:30-06', -2, 'venta_en_linea'),
        ('VIN-001', NULL,                      TIMESTAMPTZ '2026-11-01 18:30-06', -1, 'venta_en_linea');

    -- Cada pedido confirmado suma una compra (RF-34)
    UPDATE clientes.cliente c
    SET    num_compras = c.num_compras + n.pedidos
    FROM   (SELECT correo_cliente, count(*) AS pedidos FROM pedidos.pedido GROUP BY correo_cliente) n
    WHERE  c.correo_usuario = n.correo_cliente;

    -- 7) Carrito activo del cliente en línea, todavía sin pedido
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito)
    VALUES ('cliente@correo.test', 5);

    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES ('cliente@correo.test', 5, 'FUN-001', 1, 14.49, 13);
END;
$$;
