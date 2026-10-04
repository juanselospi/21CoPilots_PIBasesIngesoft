-- 004: crea la tabla PRODUCTO.

-- Guarda la información principal de cada producto.
-- El costo_total se calcula automáticamente a partir de item e importacion.
CREATE TABLE catalogo.producto (
    sku              VARCHAR(50)    PRIMARY KEY,
    nombre           VARCHAR(200)   NOT NULL,
    item             NUMERIC(12,2)  NOT NULL,             
    importacion      NUMERIC(6,2)   NOT NULL DEFAULT 0,  

   -- Costo del producto incluyendo el porcentaje de importación.
    costo_total      NUMERIC        
        GENERATED ALWAYS AS (item * (1 + importacion / 100)) STORED,
    margen_ganancia  NUMERIC(6,2)   NOT NULL DEFAULT 0,    
    tasa_impuesto    NUMERIC(5,2)   NOT NULL DEFAULT 13,   

    categoria        VARCHAR(100)   NOT NULL,
    proveedor        VARCHAR(150),
    descripcion      TEXT,

    stock            INTEGER        NOT NULL DEFAULT 0,
    imagen           VARCHAR(500),
    contrapedido     BOOLEAN        NOT NULL DEFAULT FALSE,
    
    -- El SKU se guarda en mayúsculas y sin espacios en los extremos.
    CONSTRAINT ck_producto_sku_normalizado 
        CHECK (sku = upper(btrim(sku)) AND sku <> ''),

    CONSTRAINT ck_producto_nombre          
        CHECK (btrim(nombre) <> ''),

    CONSTRAINT ck_producto_item            
        CHECK (item >= 0),

    CONSTRAINT ck_producto_importacion     
        CHECK (importacion >= 0),

    -- Permite margen negativo, pero evita que llegue a -100 % o menos.
    CONSTRAINT ck_producto_margen          
        CHECK (margen_ganancia > -100),

    CONSTRAINT ck_producto_tasa_impuesto   
        CHECK (tasa_impuesto BETWEEN 0 AND 100),

    CONSTRAINT ck_producto_categoria       
        CHECK (btrim(categoria) <> ''),

    CONSTRAINT ck_producto_stock           
        CHECK (stock >= 0)
);

-- Facilita las búsquedas de productos por categoría.
CREATE INDEX ix_producto_categoria ON catalogo.producto (categoria);
