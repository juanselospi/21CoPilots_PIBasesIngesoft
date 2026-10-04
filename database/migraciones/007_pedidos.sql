-- 007: crea las tablas relacionadas con carritos, pedidos y ofertas.

-- Guarda los carritos de cada cliente.
-- Cada cliente puede tener varios carritos, pero solo uno puede estar activo.
CREATE TABLE pedidos.carrito (
    correo_cliente  VARCHAR(255)  NOT NULL
        REFERENCES clientes.cliente (correo_usuario) 
        ON UPDATE CASCADE,
    
    num_carrito          INTEGER       NOT NULL,
    estado_carrito       VARCHAR(20)   NOT NULL DEFAULT 'activo',
    fecha_creacion       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_actualizacion  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    fecha_cierre         TIMESTAMPTZ,

    PRIMARY KEY (correo_cliente, num_carrito),

    CONSTRAINT ck_carrito_num    
        CHECK (num_carrito > 0),

    CONSTRAINT ck_carrito_estado 
        CHECK (estado_carrito IN ('activo', 'convertido')),

    -- Solo los carritos convertidos en pedido tienen fecha de cierre.
    CONSTRAINT ck_carrito_cierre 
        CHECK ((estado_carrito = 'activo') = (fecha_cierre IS NULL))
);

-- Impide que un cliente tenga más de un carrito activo.
CREATE UNIQUE INDEX ux_carrito_activo_por_cliente
    ON pedidos.carrito (correo_cliente) WHERE estado_carrito = 'activo';

-- Actualiza la fecha cada vez que cambia el carrito.
CREATE TRIGGER tg_carrito_fecha_actualizacion
    BEFORE UPDATE ON pedidos.carrito
    FOR EACH ROW EXECUTE FUNCTION public.fijar_fecha_actualizacion();

-- Guarda los productos agregados a cada carrito.
-- También conserva el precio y el impuesto usados al momento de agregarlos.
CREATE TABLE pedidos.agrega (
    correo_cliente          VARCHAR(255)   NOT NULL,
    num_carrito             INTEGER        NOT NULL,
    sku                     VARCHAR(50)    NOT NULL
        REFERENCES catalogo.producto (sku) 
        ON UPDATE CASCADE,

    cantidad_solicitada     INTEGER        NOT NULL,
    precio_unitario         NUMERIC(12,2)  NOT NULL,
    tasa_impuesto_aplicada  NUMERIC(5,2)   NOT NULL,

    PRIMARY KEY (correo_cliente, num_carrito, sku),
    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.carrito (correo_cliente, num_carrito)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT ck_agrega_cantidad 
        CHECK (cantidad_solicitada > 0),

    CONSTRAINT ck_agrega_precio   
        CHECK (precio_unitario >= 0),

    CONSTRAINT ck_agrega_tasa     
        CHECK (tasa_impuesto_aplicada BETWEEN 0 AND 100)
);

-- Facilita las búsquedas de carritos que contienen un producto.
CREATE INDEX ix_agrega_sku ON pedidos.agrega (sku);

-- Guarda las ofertas que pueden aplicarse a los pedidos.
CREATE TABLE pedidos.oferta (
    codigo_oferta           VARCHAR(30)    PRIMARY KEY,
    nombre                  VARCHAR(150)   NOT NULL,
    descripcion             TEXT,
    fecha_inicio            DATE           NOT NULL,
    fecha_fin               DATE           NOT NULL,
    porcentaje_descuento    NUMERIC(5,2)   NOT NULL,
    monto_minimo            NUMERIC(12,2)  NOT NULL DEFAULT 0,
    nivel_fidelidad_minimo  SMALLINT       NOT NULL DEFAULT 1,

    -- El código se guarda en mayúsculas y sin espacios en los extremos.
    CONSTRAINT ck_oferta_codigo_normalizado 
        CHECK (codigo_oferta = upper(btrim(codigo_oferta)) AND codigo_oferta <> ''),

    CONSTRAINT ck_oferta_vigencia           
        CHECK (fecha_fin >= fecha_inicio),

    CONSTRAINT ck_oferta_porcentaje         
        CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),

    CONSTRAINT ck_oferta_monto_minimo       
        CHECK (monto_minimo >= 0),

    CONSTRAINT ck_oferta_nivel              
        CHECK (nivel_fidelidad_minimo > 0)
);

-- Guarda el pedido creado a partir de un carrito.
CREATE TABLE pedidos.pedido (
    correo_cliente          VARCHAR(255)   NOT NULL,
    num_carrito             INTEGER        NOT NULL,
    fecha_pedido_realizado  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    fecha_entrega           TIMESTAMPTZ,
    modalidad_entrega       VARCHAR(20)    NOT NULL,
    direccion               TEXT,
    costo_entrega           NUMERIC(12,2)  NOT NULL DEFAULT 0,   
    codigo_oferta           VARCHAR(30)
        REFERENCES pedidos.oferta (codigo_oferta) 
        ON UPDATE CASCADE,

    PRIMARY KEY (correo_cliente, num_carrito),

    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.carrito (correo_cliente, num_carrito) ON UPDATE CASCADE,

    CONSTRAINT ck_pedido_modalidad 
    CHECK (modalidad_entrega IN ('mensajero', 'uber_flash', 'correos_cr', 'entrega_personal')),

    CONSTRAINT ck_pedido_costo_entrega 
        CHECK (costo_entrega >= 0),

    CONSTRAINT ck_pedido_fecha_entrega 
        CHECK (fecha_entrega IS NULL OR fecha_entrega >= fecha_pedido_realizado)
);

-- Facilitan búsquedas de pedidos por fecha y oferta.
CREATE INDEX ix_pedido_fecha  
    ON pedidos.pedido (fecha_pedido_realizado);


CREATE INDEX ix_pedido_oferta 
    ON pedidos.pedido (codigo_oferta);

-- Guarda cada cambio de estado de un pedido.
-- El estado actual se obtiene del último registro del historial.
CREATE TABLE pedidos.historial_estado (
    correo_cliente  VARCHAR(255)  NOT NULL,
    num_carrito     INTEGER       NOT NULL,
    numero_cambio   INTEGER       NOT NULL,
    estado          VARCHAR(20)   NOT NULL,
    fecha           TIMESTAMPTZ   NOT NULL DEFAULT now(),

    PRIMARY KEY (correo_cliente, num_carrito, numero_cambio),

    FOREIGN KEY (correo_cliente, num_carrito)
        REFERENCES pedidos.pedido (correo_cliente, num_carrito) 
        ON UPDATE CASCADE,
        
    CONSTRAINT ck_historial_numero 
        CHECK (numero_cambio > 0),
    
    CONSTRAINT ck_historial_estado 
        CHECK (estado IN ('colocado', 'procesado', 'en_transito', 'finalizado', 'cancelado'))
);

-- El historial no se puede modificar ni eliminar una vez registrado.
CREATE TRIGGER tg_historial_solo_insercion
    BEFORE UPDATE OR DELETE ON pedidos.historial_estado
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();