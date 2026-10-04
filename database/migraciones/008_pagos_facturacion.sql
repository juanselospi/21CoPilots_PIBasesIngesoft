-- 008: crea las tablas PAGO y FACTURA.

-- Guarda los intentos de pago realizados para cada pedido.
-- Un pedido puede tener varios pagos.
CREATE TABLE pagos.pago (
    num_referencia  VARCHAR(100)   PRIMARY KEY,  
    fecha           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    monto           NUMERIC(12,2)  NOT NULL,
    metodo_pago     VARCHAR(20)    NOT NULL,
    estado_pago     VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    correo_cliente  VARCHAR(255)   NOT NULL,
    num_carrito     INTEGER        NOT NULL,

    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.pedido (correo_cliente, num_carrito) 
        ON UPDATE CASCADE,

    CONSTRAINT ck_pago_referencia  
        CHECK (btrim(num_referencia) <> ''),

    CONSTRAINT ck_pago_monto      
        CHECK (monto >= 0),
    
    CONSTRAINT ck_pago_metodo CHECK (
        metodo_pago IN ('tarjeta', 'sinpe_movil', 'efectivo', 'datafono', 'contra_entrega')
    ),
    
    CONSTRAINT ck_pago_estado 
        CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado'))
);

-- Facilita las búsquedas de pagos asociados a un pedido.
CREATE INDEX ix_pago_pedido ON pagos.pago (correo_cliente, num_carrito);

-- Guarda la factura generada a partir de un pago.
-- Un pago puede tener como máximo una factura.
CREATE TABLE facturacion.factura (
    num_factura     VARCHAR(50)   PRIMARY KEY,
    fecha_emision   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    num_referencia  VARCHAR(100)  NOT NULL
        REFERENCES pagos.pago (num_referencia) ON UPDATE CASCADE,
   
    CONSTRAINT ux_factura_pago   
        UNIQUE (num_referencia),

    CONSTRAINT ck_factura_numero 
        CHECK (btrim(num_factura) <> '')
);
