-- =====================================================================
-- 004 — Módulo catalogo: PRODUCTO
--
-- Mapeo:
--   PRODUCTO (PK SKU, Nombre, CostoTotal, Importación, Item, Categoria,
--             Proveedor, MargenGanancia, Descripcion, Stock, Imagen,
--             Contrapedido, TasaImpuesto)
--
-- En el EER, "Costo Total" es un atributo compuesto de "Item" (costo del
-- producto) e "Importación" (porcentaje). Según la fórmula de precio
-- (documentos/diseño/formula-precio.md), costo total = item + importación %.
-- Se guarda como columna generada: nunca puede contradecir a sus partes.
--
-- "Precio Venta" es un atributo derivado (línea punteada en el EER) y no se
-- guarda: lo calcula el motor de precios a partir de estas columnas.
-- =====================================================================

CREATE TABLE catalogo.producto (
    sku              VARCHAR(50)    PRIMARY KEY,
    nombre           VARCHAR(200)   NOT NULL,
    item             NUMERIC(12,2)  NOT NULL,              -- costo del producto, en colones
    importacion      NUMERIC(6,2)   NOT NULL DEFAULT 0,    -- porcentaje sobre el item
    -- Valor exacto, sin redondear: la fórmula redondea solo lo que se muestra
    costo_total      NUMERIC        GENERATED ALWAYS AS (item * (1 + importacion / 100)) STORED,
    margen_ganancia  NUMERIC(6,2)   NOT NULL DEFAULT 0,    -- porcentaje sobre el costo total
    tasa_impuesto    NUMERIC(5,2)   NOT NULL DEFAULT 13,   -- impuesto de venta (RES-06)
    categoria        VARCHAR(100)   NOT NULL,
    proveedor        VARCHAR(150),
    descripcion      TEXT,
    stock            INTEGER        NOT NULL DEFAULT 0,
    imagen           VARCHAR(500),
    contrapedido     BOOLEAN        NOT NULL DEFAULT FALSE,
    -- El SKU se guarda normalizado (mayúsculas, sin espacios en los extremos),
    -- así "PKM-001" y "pkm-001 " no pueden coexistir (RF-01) y la importación
    -- puede usar ON CONFLICT (sku) directamente (RF-59)
    CONSTRAINT ck_producto_sku_normalizado CHECK (sku = upper(btrim(sku)) AND sku <> ''),
    CONSTRAINT ck_producto_nombre          CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_producto_item            CHECK (item >= 0),
    CONSTRAINT ck_producto_importacion     CHECK (importacion >= 0),
    -- RN-02 admite margen negativo; solo se impide que el precio llegue a cero o menos
    CONSTRAINT ck_producto_margen          CHECK (margen_ganancia > -100),
    CONSTRAINT ck_producto_tasa_impuesto   CHECK (tasa_impuesto BETWEEN 0 AND 100),
    CONSTRAINT ck_producto_categoria       CHECK (btrim(categoria) <> ''),
    -- Segunda línea de defensa de RN-13: la primera es el servicio
    CONSTRAINT ck_producto_stock           CHECK (stock >= 0)
);
CREATE INDEX ix_producto_categoria ON catalogo.producto (categoria);
