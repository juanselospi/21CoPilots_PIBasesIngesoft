-- Datos de prueba: un pedido en línea pagado y facturado, y una venta
-- presencial. SOLO para desarrollo local. Sirven para ver los reportes
-- (EP-06) con datos y como ejemplo de las escrituras que hace el servidor
-- al confirmar un pedido (§ 10.2 del documento de arquitectura).
-- Los precios siguen la fórmula provisional de RN-01 (costo × importación ×
-- margen, más 13 %); en ejecución los calcula el motor de precios.

DO $$
DECLARE
    v_admin    BIGINT := (SELECT id FROM admin.usuario    WHERE correo = 'admin@dchobbies.test');
    v_usuario  BIGINT := (SELECT id FROM admin.usuario    WHERE correo = 'cliente@correo.test');
    v_cliente  BIGINT := (SELECT id FROM clientes.cliente WHERE correo = 'cliente@correo.test');
    v_otro     BIGINT := (SELECT id FROM clientes.cliente WHERE correo = 'presencial@correo.test');
    v_pkm      BIGINT := (SELECT id FROM catalogo.producto WHERE sku = 'PKM-001');
    v_ygo      BIGINT := (SELECT id FROM catalogo.producto WHERE sku = 'YGO-001');
    v_jug      BIGINT := (SELECT id FROM catalogo.producto WHERE sku = 'JUG-002');
    v_carrito  BIGINT;
    v_pedido   BIGINT;
BEGIN
    -- Idempotente: si ya hay pedidos, no se vuelven a crear
    IF EXISTS (SELECT 1 FROM pedidos.pedido) THEN
        RETURN;
    END IF;

    -- 1) Pedido en línea: 2 sobres Pokémon y 1 Yu-Gi-Oh!, entregado
    INSERT INTO pedidos.carrito (usuario_id, estado, cerrado_en)
    VALUES (v_usuario, 'convertido', TIMESTAMPTZ '2026-09-10 11:00-06')
    RETURNING id INTO v_carrito;

    INSERT INTO pedidos.linea_carrito (carrito_id, producto_id, cantidad)
    VALUES (v_carrito, v_pkm, 2), (v_carrito, v_ygo, 1);

    INSERT INTO pedidos.pedido (canal, cliente_id, carrito_id, estado, estado_pago,
                                modalidad_entrega, direccion_entrega, numero_guia,
                                subtotal, descuento, impuesto, costo_envio, total, colocado_en)
    VALUES ('en_linea', v_cliente, v_carrito, 'finalizado', 'pagado',
            'correos_cr', 'San Pedro, Montes de Oca, San José', 'CR123456789',
            18000.00, 0, 2340.00, 2500.00, 22840.00, TIMESTAMPTZ '2026-09-10 11:00-06')
    RETURNING id INTO v_pedido;

    INSERT INTO pedidos.linea_pedido (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (v_pedido, v_pkm, 2, 3750.00), (v_pedido, v_ygo, 1, 10500.00);

    INSERT INTO pedidos.historial_estado (pedido_id, estado, usuario_id, registrado_en) VALUES
        (v_pedido, 'colocado',    NULL,    TIMESTAMPTZ '2026-09-10 11:00-06'),
        (v_pedido, 'procesado',   v_admin, TIMESTAMPTZ '2026-09-10 15:00-06'),
        (v_pedido, 'en_transito', v_admin, TIMESTAMPTZ '2026-09-11 09:00-06'),
        (v_pedido, 'finalizado',  v_admin, TIMESTAMPTZ '2026-09-13 16:00-06');

    INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, pedido_id, registrado_en) VALUES
        (v_pkm, 'venta', -2, v_pedido, TIMESTAMPTZ '2026-09-10 11:00-06'),
        (v_ygo, 'venta', -1, v_pedido, TIMESTAMPTZ '2026-09-10 11:00-06');
    UPDATE inventario.existencia SET cantidad = cantidad - 2 WHERE producto_id = v_pkm;
    UPDATE inventario.existencia SET cantidad = cantidad - 1 WHERE producto_id = v_ygo;

    INSERT INTO pagos.intento_pago (pedido_id, carrito_id, metodo, monto, resultado,
                                    referencia_externa, solicitado_en, resuelto_en)
    VALUES (v_pedido, v_carrito, 'tarjeta', 22840.00, 'aprobado', 'SIM-0001',
            TIMESTAMPTZ '2026-09-10 10:59-06', TIMESTAMPTZ '2026-09-10 11:00-06');

    INSERT INTO facturacion.factura (pedido_id, consecutivo, estado,
                                     emisor_razon_social, emisor_cedula_juridica,
                                     receptor_nombre, receptor_cedula,
                                     subtotal, descuento, impuesto, costo_envio, total, emitida_en)
    VALUES (v_pedido, 'SIM-FE-0001', 'emitida',
            'POR DEFINIR', 'POR DEFINIR', 'Cliente de Prueba', '1-1111-1111',
            18000.00, 0, 2340.00, 2500.00, 22840.00, TIMESTAMPTZ '2026-09-10 11:01-06');

    UPDATE clientes.cliente SET num_compras = num_compras + 1 WHERE id = v_cliente;

    -- 2) Venta presencial registrada por el administrador (RF-17)
    INSERT INTO pedidos.pedido (canal, cliente_id, registrado_por, estado, estado_pago,
                                subtotal, descuento, impuesto, costo_envio, total, colocado_en)
    VALUES ('presencial', v_otro, v_admin, 'finalizado', 'pagado',
            11960.00, 0, 1554.80, 0, 13514.80, TIMESTAMPTZ '2026-09-12 13:00-06')
    RETURNING id INTO v_pedido;

    INSERT INTO pedidos.linea_pedido (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (v_pedido, v_jug, 1, 11960.00);

    INSERT INTO pedidos.historial_estado (pedido_id, estado, usuario_id, registrado_en) VALUES
        (v_pedido, 'colocado',   v_admin, TIMESTAMPTZ '2026-09-12 13:00-06'),
        (v_pedido, 'finalizado', v_admin, TIMESTAMPTZ '2026-09-12 13:00-06');

    INSERT INTO inventario.movimiento (producto_id, tipo, cantidad, pedido_id, responsable_id, registrado_en)
    VALUES (v_jug, 'venta', -1, v_pedido, v_admin, TIMESTAMPTZ '2026-09-12 13:00-06');
    UPDATE inventario.existencia SET cantidad = cantidad - 1 WHERE producto_id = v_jug;

    UPDATE clientes.cliente SET num_compras = num_compras + 1 WHERE id = v_otro;
END;
$$;
