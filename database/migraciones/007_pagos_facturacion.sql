-- =====================================================================
-- 007 — Módulos pagos y facturacion: PAGO y FACTURA (placeholder, RES-03)
--
-- Mapeo:
--   PAGO    (PK NumReferencia, Fecha, Monto, MetodoPago, EstadoPago,
--            FK CorreoCliente, FK NumCarrito → PEDIDO)
--   FACTURA (PK NumFactura, FechaEmision, FK NumReferencia → PAGO)
--
-- "Necesita": un pedido tiene N pagos (p. ej. un rechazo y luego un cobro
-- aprobado). "Respalda": un pago tiene 0..1 facturas.
-- Subtotal, Impuestos, Descuento y Total de la factura son atributos
-- derivados (línea punteada en el EER): se calculan de las líneas del pedido
-- y no se guardan (ver reportes.v_pedidos_por_cliente).
-- =====================================================================

CREATE TABLE pagos.pago (
    num_referencia  VARCHAR(100)   PRIMARY KEY,   -- la que devuelve la pasarela
    fecha           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    monto           NUMERIC(12,2)  NOT NULL,
    metodo_pago     VARCHAR(20)    NOT NULL,
    estado_pago     VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    correo_cliente  VARCHAR(255)   NOT NULL,
    num_carrito     INTEGER        NOT NULL,
    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.pedido (correo_cliente, num_carrito) ON UPDATE CASCADE,
    CONSTRAINT ck_pago_referencia CHECK (btrim(num_referencia) <> ''),
    CONSTRAINT ck_pago_monto      CHECK (monto >= 0),
    -- tarjeta es el método del alcance inicial (RF-39); los demás son RF-61 y RF-68
    CONSTRAINT ck_pago_metodo CHECK (
        metodo_pago IN ('tarjeta', 'sinpe_movil', 'efectivo', 'datafono', 'contra_entrega')
    ),
    -- RF-40
    CONSTRAINT ck_pago_estado CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado'))
);
CREATE INDEX ix_pago_pedido ON pagos.pago (correo_cliente, num_carrito);

-- RF-41, RN-18: factura del pago que la respalda
CREATE TABLE facturacion.factura (
    num_factura     VARCHAR(50)   PRIMARY KEY,
    fecha_emision   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    num_referencia  VARCHAR(100)  NOT NULL
        REFERENCES pagos.pago (num_referencia) ON UPDATE CASCADE,
    -- "Respalda" es 1 a 0..1: un pago tiene como máximo una factura
    CONSTRAINT ux_factura_pago   UNIQUE (num_referencia),
    CONSTRAINT ck_factura_numero CHECK (btrim(num_factura) <> '')
);
