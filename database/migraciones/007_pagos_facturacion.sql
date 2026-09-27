-- =====================================================================
-- 007 — Módulos pagos y facturacion (placeholder en esta versión, RES-03)
-- =====================================================================

-- Cada intento de cobro. RF-39: un pago rechazado no crea pedido, así que un
-- intento puede referirse solo al carrito. RNF-06: si la pasarela no responde
-- no hay referencia externa, y aun así el intento se registra.
CREATE TABLE pagos.intento_pago (
    id                  BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id           BIGINT         REFERENCES pedidos.pedido (id),
    carrito_id          BIGINT         REFERENCES pedidos.carrito (id),
    metodo              VARCHAR(20)    NOT NULL,
    monto               NUMERIC(12,2)  NOT NULL,
    resultado           VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    referencia_externa  VARCHAR(100)   UNIQUE,     -- la que devuelve la pasarela
    solicitado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    resuelto_en         TIMESTAMPTZ,               -- fecha de resolución (RF-40)
    CONSTRAINT ck_intento_origen CHECK (pedido_id IS NOT NULL OR carrito_id IS NOT NULL),
    -- tarjeta es el método del alcance inicial (RF-39); los demás son RF-61 y RF-68
    CONSTRAINT ck_intento_metodo CHECK (
        metodo IN ('tarjeta', 'sinpe_movil', 'efectivo', 'datafono', 'contra_entrega')
    ),
    CONSTRAINT ck_intento_resultado CHECK (
        resultado IN ('pendiente', 'aprobado', 'rechazado', 'no_disponible')
    ),
    CONSTRAINT ck_intento_resolucion CHECK ((resultado = 'pendiente') = (resuelto_en IS NULL)),
    CONSTRAINT ck_intento_monto      CHECK (monto >= 0)
);
CREATE INDEX ix_intento_pedido  ON pagos.intento_pago (pedido_id);
CREATE INDEX ix_intento_carrito ON pagos.intento_pago (carrito_id);

-- RF-41, RN-18: factura de un pedido pagado. Guarda una copia de los datos
-- fiscales y de los montos al emitirla: si después cambian los datos del
-- cliente o del negocio, la factura emitida no cambia. Sus líneas son las de
-- pedidos.linea_pedido, que no se pueden modificar.
CREATE TABLE facturacion.factura (
    id                      BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id               BIGINT         NOT NULL UNIQUE REFERENCES pedidos.pedido (id),
    consecutivo             VARCHAR(50)    UNIQUE,   -- lo asigna el emisor al emitir
    estado                  VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    emisor_razon_social     VARCHAR(200)   NOT NULL,
    emisor_cedula_juridica  VARCHAR(20)    NOT NULL,
    receptor_nombre         VARCHAR(150)   NOT NULL,
    receptor_cedula         VARCHAR(20)    NOT NULL,
    subtotal                NUMERIC(12,2)  NOT NULL,
    descuento               NUMERIC(12,2)  NOT NULL DEFAULT 0,
    impuesto                NUMERIC(12,2)  NOT NULL,
    costo_envio             NUMERIC(12,2)  NOT NULL DEFAULT 0,
    total                   NUMERIC(12,2)  NOT NULL,
    creada_en               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    emitida_en              TIMESTAMPTZ,
    CONSTRAINT ck_factura_estado CHECK (estado IN ('pendiente', 'emitida', 'rechazada')),
    CONSTRAINT ck_factura_emision CHECK (
        (estado = 'emitida') = (emitida_en IS NOT NULL AND consecutivo IS NOT NULL)
    ),
    CONSTRAINT ck_factura_montos CHECK (
        subtotal >= 0 AND descuento >= 0 AND impuesto >= 0 AND costo_envio >= 0 AND total >= 0
    )
);
