-- =====================================================================
-- 006 — Módulo pedidos: carrito, pedido, líneas e historial de estados
--
-- El pedido es una entidad independiente del carrito (DD-15): tiene su
-- propio identificador (RF-30), sus propias líneas con el precio vigente al
-- confirmar (DD-13) y puede nacer de una venta en otro canal (RF-17).
-- =====================================================================

-- RN-14, RF-24: el carrito se conserva indefinidamente, entre sesiones.
-- Pertenece a la cuenta que inició sesión. No guarda precios: el precio se
-- calcula al mostrarlo y se fija al confirmar el pedido.
CREATE TABLE pedidos.carrito (
    id              BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES admin.usuario (id),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'activo',
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    cerrado_en      TIMESTAMPTZ,
    CONSTRAINT ck_carrito_estado CHECK (estado IN ('activo', 'convertido')),
    CONSTRAINT ck_carrito_cierre CHECK ((estado = 'activo') = (cerrado_en IS NULL))
);
-- Un solo carrito activo por cuenta
CREATE UNIQUE INDEX ux_carrito_activo_por_usuario
    ON pedidos.carrito (usuario_id) WHERE estado = 'activo';

CREATE TRIGGER tg_carrito_actualizado_en
    BEFORE UPDATE ON pedidos.carrito
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();

CREATE TABLE pedidos.linea_carrito (
    carrito_id   BIGINT       NOT NULL REFERENCES pedidos.carrito (id) ON DELETE CASCADE,
    producto_id  BIGINT       NOT NULL REFERENCES catalogo.producto (id),
    cantidad     INTEGER      NOT NULL,
    agregado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (carrito_id, producto_id),
    CONSTRAINT ck_linea_carrito_cantidad CHECK (cantidad > 0)
);
CREATE INDEX ix_linea_carrito_producto ON pedidos.linea_carrito (producto_id);

-- RF-25, RF-30, RF-31: el pedido registra fecha, cliente, modalidad y
-- dirección de entrega. Los montos son una copia fija al confirmar: un cambio
-- posterior en la fórmula de precio (INC-05) no altera un pedido hecho.
CREATE TABLE pedidos.pedido (
    id                 BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    canal              VARCHAR(20)    NOT NULL DEFAULT 'en_linea',
    cliente_id         BIGINT         REFERENCES clientes.cliente (id),
    carrito_id         BIGINT         UNIQUE REFERENCES pedidos.carrito (id),
    registrado_por     BIGINT         REFERENCES admin.usuario (id),   -- quien registra una venta externa
    -- Estado vigente. Cada cambio queda además en historial_estado; el
    -- servicio escribe ambos en la misma transacción. Qué transición es
    -- legal lo decide la tabla de transiciones del dominio (§ 6.4), no la BD.
    estado             VARCHAR(20)    NOT NULL DEFAULT 'colocado',
    estado_pago        VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    modalidad_entrega  VARCHAR(20),
    direccion_entrega  TEXT,
    numero_guia        VARCHAR(100),  -- RF-63
    subtotal           NUMERIC(12,2)  NOT NULL,
    descuento          NUMERIC(12,2)  NOT NULL DEFAULT 0,
    impuesto           NUMERIC(12,2)  NOT NULL,
    costo_envio        NUMERIC(12,2)  NOT NULL DEFAULT 0,   -- RN-16, RF-62
    total              NUMERIC(12,2)  NOT NULL,
    colocado_en        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT ck_pedido_canal CHECK (canal IN ('en_linea', 'presencial', 'redes_sociales')),
    -- RF-26 más el estado de cancelación de RF-28
    CONSTRAINT ck_pedido_estado CHECK (
        estado IN ('colocado', 'procesado', 'en_transito', 'finalizado', 'cancelado')
    ),
    -- RF-40; pendiente_cobro es el pago contra entrega (RF-69)
    CONSTRAINT ck_pedido_estado_pago CHECK (
        estado_pago IN ('pendiente', 'pagado', 'pendiente_cobro')
    ),
    -- RF-62; la tabla de tarifas sigue pendiente (DEP-07)
    CONSTRAINT ck_pedido_modalidad CHECK (
        modalidad_entrega IN ('mensajero', 'uber_flash', 'correos_cr', 'entrega_personal')
    ),
    -- Un pedido en línea siempre tiene cliente y modalidad de entrega
    CONSTRAINT ck_pedido_en_linea CHECK (
        canal <> 'en_linea' OR (cliente_id IS NOT NULL AND modalidad_entrega IS NOT NULL)
    ),
    -- Una venta de otro canal la registra un administrador y no viene de un carrito
    CONSTRAINT ck_pedido_externo CHECK (
        canal = 'en_linea' OR (registrado_por IS NOT NULL AND carrito_id IS NULL)
    ),
    CONSTRAINT ck_pedido_montos CHECK (
        subtotal >= 0 AND descuento >= 0 AND impuesto >= 0 AND costo_envio >= 0 AND total >= 0
    )
);
CREATE INDEX ix_pedido_cliente ON pedidos.pedido (cliente_id);
CREATE INDEX ix_pedido_estado  ON pedidos.pedido (estado);
CREATE INDEX ix_pedido_fecha   ON pedidos.pedido (colocado_en);

CREATE TRIGGER tg_pedido_actualizado_en
    BEFORE UPDATE ON pedidos.pedido
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();

-- Líneas del pedido: se escriben al confirmar y no cambian nunca.
CREATE TABLE pedidos.linea_pedido (
    pedido_id              BIGINT         NOT NULL REFERENCES pedidos.pedido (id),
    producto_id            BIGINT         NOT NULL REFERENCES catalogo.producto (id),
    cantidad               INTEGER        NOT NULL,
    -- Parte de la cantidad que no había en existencia y se pidió por
    -- contrapedido (RN-13, RF-23). Esa parte no descuenta existencias.
    cantidad_contrapedido  INTEGER        NOT NULL DEFAULT 0,
    precio_unitario        NUMERIC(12,2)  NOT NULL,   -- sin impuesto, vigente al confirmar
    PRIMARY KEY (pedido_id, producto_id),
    CONSTRAINT ck_linea_pedido_cantidad      CHECK (cantidad > 0),
    CONSTRAINT ck_linea_pedido_contrapedido  CHECK (cantidad_contrapedido BETWEEN 0 AND cantidad),
    CONSTRAINT ck_linea_pedido_precio        CHECK (precio_unitario >= 0)
);
CREATE INDEX ix_linea_pedido_producto ON pedidos.linea_pedido (producto_id);

CREATE TRIGGER tg_linea_pedido_solo_insercion
    BEFORE UPDATE OR DELETE ON pedidos.linea_pedido
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();

-- RF-26: cada transición queda registrada con su fecha. Solo inserción.
CREATE TABLE pedidos.historial_estado (
    id             BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id      BIGINT       NOT NULL REFERENCES pedidos.pedido (id),
    estado         VARCHAR(20)  NOT NULL,
    usuario_id     BIGINT       REFERENCES admin.usuario (id),   -- quien hizo el cambio
    registrado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_historial_estado CHECK (
        estado IN ('colocado', 'procesado', 'en_transito', 'finalizado', 'cancelado')
    )
);
CREATE INDEX ix_historial_pedido ON pedidos.historial_estado (pedido_id, registrado_en);

CREATE TRIGGER tg_historial_solo_insercion
    BEFORE UPDATE OR DELETE ON pedidos.historial_estado
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();

-- Llave foránea pendiente de 004: ventas y cancelaciones apuntan a su pedido
ALTER TABLE inventario.movimiento
    ADD CONSTRAINT fk_movimiento_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido (id);
