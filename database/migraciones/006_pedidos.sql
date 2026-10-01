-- =====================================================================
-- 006 — Módulo pedidos: CARRITO, AGREGA, OFERTA, PEDIDO e HISTORIAL_ESTADO
--
-- Mapeo:
--   CARRITO          (PK/FK CorreoCliente → CLIENTE, PK NumCarrito,
--                     EstadoCarrito, FechaCreacion, FechaActualizacion, FechaCierre)
--   AGREGA           (PK/FK CorreoCliente, PK/FK NumCarrito → CARRITO,
--                     PK/FK SKU → PRODUCTO,
--                     CantidadSolicitada, PrecioUnitario, TasaImpuestoAplicada)
--   OFERTA           (PK CodigoOferta, Nombre, Descripcion, FechaInicio, FechaFin,
--                     PorcentajeDescuento, MontoMinimo, NivelFidelidadMinimo)
--   PEDIDO           (PK/FK CorreoCliente, PK/FK NumCarrito → CARRITO,
--                     FechaPedidoRealizado, FechaEntrega, ModalidadEntrega,
--                     Direccion, CostoEntrega, FK CódigoOferta → OFERTA)
--   HISTORIAL_ESTADO (PK/FK CorreoCliente, PK/FK NumCarrito → PEDIDO,
--                     PK NumeroCambio, Estado, Fecha)
--
-- Carrito es entidad débil de Cliente ("Tiene"); Pedido es entidad débil de
-- Carrito ("Convierte", 1..1 con 0..1), e Historial del Estado es entidad
-- débil de Pedido ("Actualiza"). Por eso sus llaves se heredan.
-- "Estado pedido" es un atributo derivado del historial (reportes.v_estado_pedido).
-- =====================================================================

-- RN-14, RF-24: el carrito se conserva entre sesiones. NumCarrito es la
-- llave parcial: numera los carritos de cada cliente (1, 2, 3...).
CREATE TABLE pedidos.carrito (
    correo_cliente       VARCHAR(255)  NOT NULL
        REFERENCES clientes.cliente (correo_usuario) ON UPDATE CASCADE,
    num_carrito          INTEGER       NOT NULL,
    estado_carrito       VARCHAR(20)   NOT NULL DEFAULT 'activo',
    fecha_creacion       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_actualizacion  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_cierre         TIMESTAMPTZ,
    PRIMARY KEY (correo_cliente, num_carrito),
    CONSTRAINT ck_carrito_num    CHECK (num_carrito > 0),
    CONSTRAINT ck_carrito_estado CHECK (estado_carrito IN ('activo', 'convertido')),
    -- Solo un carrito cerrado (convertido en pedido) tiene fecha de cierre
    CONSTRAINT ck_carrito_cierre CHECK ((estado_carrito = 'activo') = (fecha_cierre IS NULL))
);
-- Un solo carrito activo por cliente
CREATE UNIQUE INDEX ux_carrito_activo_por_cliente
    ON pedidos.carrito (correo_cliente) WHERE estado_carrito = 'activo';

CREATE TRIGGER tg_carrito_fecha_actualizacion
    BEFORE UPDATE ON pedidos.carrito
    FOR EACH ROW EXECUTE FUNCTION public.fijar_fecha_actualizacion();

-- Relación "Agrega" (N:M) entre Carrito y Producto. El precio unitario (sin
-- impuesto) y la tasa quedan fijados en la línea: son los que se cobran
-- cuando el carrito se convierte en pedido.
CREATE TABLE pedidos.agrega (
    correo_cliente          VARCHAR(255)   NOT NULL,
    num_carrito             INTEGER        NOT NULL,
    sku                     VARCHAR(50)    NOT NULL
        REFERENCES catalogo.producto (sku) ON UPDATE CASCADE,
    cantidad_solicitada     INTEGER        NOT NULL,
    precio_unitario         NUMERIC(12,2)  NOT NULL,
    tasa_impuesto_aplicada  NUMERIC(5,2)   NOT NULL,
    PRIMARY KEY (correo_cliente, num_carrito, sku),
    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.carrito (correo_cliente, num_carrito)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_agrega_cantidad CHECK (cantidad_solicitada > 0),
    CONSTRAINT ck_agrega_precio   CHECK (precio_unitario >= 0),
    CONSTRAINT ck_agrega_tasa     CHECK (tasa_impuesto_aplicada BETWEEN 0 AND 100)
);
CREATE INDEX ix_agrega_sku ON pedidos.agrega (sku);

-- Descuentos que se pueden aplicar a un pedido ("Aplicar", 0..1 a 0..n)
CREATE TABLE pedidos.oferta (
    codigo_oferta           VARCHAR(30)    PRIMARY KEY,
    nombre                  VARCHAR(150)   NOT NULL,
    descripcion             TEXT,
    fecha_inicio            DATE           NOT NULL,
    fecha_fin               DATE           NOT NULL,
    porcentaje_descuento    NUMERIC(5,2)   NOT NULL,
    monto_minimo            NUMERIC(12,2)  NOT NULL DEFAULT 0,
    nivel_fidelidad_minimo  SMALLINT       NOT NULL DEFAULT 1,
    CONSTRAINT ck_oferta_codigo_normalizado CHECK (codigo_oferta = upper(btrim(codigo_oferta)) AND codigo_oferta <> ''),
    CONSTRAINT ck_oferta_vigencia           CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT ck_oferta_porcentaje         CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    CONSTRAINT ck_oferta_monto_minimo       CHECK (monto_minimo >= 0),
    CONSTRAINT ck_oferta_nivel              CHECK (nivel_fidelidad_minimo > 0)
);

-- RF-25, RF-30, RF-31: el pedido registra fecha, modalidad y dirección de
-- entrega. Hereda la llave del carrito del que nace.
CREATE TABLE pedidos.pedido (
    correo_cliente          VARCHAR(255)   NOT NULL,
    num_carrito             INTEGER        NOT NULL,
    fecha_pedido_realizado  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    fecha_entrega           TIMESTAMPTZ,
    modalidad_entrega       VARCHAR(20)    NOT NULL,
    direccion               TEXT,
    costo_entrega           NUMERIC(12,2)  NOT NULL DEFAULT 0,   -- RN-16, RF-62
    codigo_oferta           VARCHAR(30)
        REFERENCES pedidos.oferta (codigo_oferta) ON UPDATE CASCADE,
    PRIMARY KEY (correo_cliente, num_carrito),
    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.carrito (correo_cliente, num_carrito) ON UPDATE CASCADE,
    -- RF-62; la tabla de tarifas sigue pendiente (DEP-07)
    CONSTRAINT ck_pedido_modalidad CHECK (
        modalidad_entrega IN ('mensajero', 'uber_flash', 'correos_cr', 'entrega_personal')
    ),
    CONSTRAINT ck_pedido_costo_entrega CHECK (costo_entrega >= 0),
    CONSTRAINT ck_pedido_fecha_entrega CHECK (
        fecha_entrega IS NULL OR fecha_entrega >= fecha_pedido_realizado
    )
);
CREATE INDEX ix_pedido_fecha  ON pedidos.pedido (fecha_pedido_realizado);
CREATE INDEX ix_pedido_oferta ON pedidos.pedido (codigo_oferta);

-- RF-26: cada cambio de estado queda registrado con su fecha. NumeroCambio es
-- la llave parcial (1, 2, 3... por pedido). Solo inserción.
CREATE TABLE pedidos.historial_estado (
    correo_cliente  VARCHAR(255)  NOT NULL,
    num_carrito     INTEGER       NOT NULL,
    numero_cambio   INTEGER       NOT NULL,
    estado          VARCHAR(20)   NOT NULL,
    fecha           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PRIMARY KEY (correo_cliente, num_carrito, numero_cambio),
    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.pedido (correo_cliente, num_carrito) ON UPDATE CASCADE,
    CONSTRAINT ck_historial_numero CHECK (numero_cambio > 0),
    -- RF-26 más el estado de cancelación de RF-28
    CONSTRAINT ck_historial_estado CHECK (
        estado IN ('colocado', 'procesado', 'en_transito', 'finalizado', 'cancelado')
    )
);

CREATE TRIGGER tg_historial_solo_insercion
    BEFORE UPDATE OR DELETE ON pedidos.historial_estado
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
