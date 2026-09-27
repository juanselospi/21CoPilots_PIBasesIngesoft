-- =====================================================================
-- 003 — Módulo catalogo: categorías, subcategorías y productos
--
-- El precio de venta NO se guarda (DD-13): se guardan sus entradas y lo
-- calcula el motor de precios del dominio (§ 6.5). Así, cerrar INC-05 no
-- obliga a recalcular ninguna tabla.
-- =====================================================================

-- RF-02: el SRS fija exactamente dos niveles (§ 5.5), por eso son dos tablas.
CREATE TABLE catalogo.categoria (
    id      INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  VARCHAR(100)  NOT NULL,
    CONSTRAINT ck_categoria_nombre CHECK (btrim(nombre) <> '')
);
-- "Videojuegos" y "videojuegos " son la misma categoría
CREATE UNIQUE INDEX ux_categoria_nombre ON catalogo.categoria (lower(btrim(nombre)));

CREATE TABLE catalogo.subcategoria (
    id            INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id  INTEGER       NOT NULL REFERENCES catalogo.categoria (id),
    nombre        VARCHAR(100)  NOT NULL,
    CONSTRAINT ck_subcategoria_nombre CHECK (btrim(nombre) <> '')
);
CREATE UNIQUE INDEX ux_subcategoria_nombre
    ON catalogo.subcategoria (categoria_id, lower(btrim(nombre)));

CREATE TABLE catalogo.producto (
    id                      BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku                     VARCHAR(50)    NOT NULL,
    nombre                  VARCHAR(200)   NOT NULL,
    descripcion             TEXT,
    subcategoria_id         INTEGER        NOT NULL REFERENCES catalogo.subcategoria (id),
    proveedor               VARCHAR(150),
    imagen_url              VARCHAR(500),
    -- Entradas del precio (RN-01). costo_item es el costo vigente para calcular
    -- el precio; el histórico de costos vive en inventario.movimiento (RN-06).
    costo_item              NUMERIC(12,2)  NOT NULL,
    porcentaje_importacion  NUMERIC(6,2)   NOT NULL DEFAULT 0,
    margen_ganancia         NUMERIC(6,2)   NOT NULL DEFAULT 0,
    admite_contrapedido     BOOLEAN        NOT NULL DEFAULT FALSE,
    -- "Excluir" un producto es baja lógica: nunca se borra, porque lo
    -- referencian pedidos y movimientos (RF-18)
    estado                  VARCHAR(20)    NOT NULL DEFAULT 'activo',
    fecha_retiro            DATE,          -- retiro programado de temporada (RF-09)
    creado_en               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    -- El SKU se guarda normalizado (mayúsculas, sin espacios en los extremos),
    -- así "PKM-001" y "pkm-001 " no pueden coexistir (RF-01) y el upsert de la
    -- importación puede usar ON CONFLICT (sku) directamente (RF-59)
    CONSTRAINT ck_producto_sku_normalizado CHECK (sku = upper(btrim(sku)) AND sku <> ''),
    CONSTRAINT ux_producto_sku             UNIQUE (sku),
    CONSTRAINT ck_producto_costo           CHECK (costo_item >= 0),
    CONSTRAINT ck_producto_importacion     CHECK (porcentaje_importacion >= 0),
    -- RN-02 admite margen negativo; solo se impide que el precio llegue a cero o menos
    CONSTRAINT ck_producto_margen          CHECK (margen_ganancia > -100),
    CONSTRAINT ck_producto_estado          CHECK (estado IN ('activo', 'descontinuado'))
);
CREATE INDEX ix_producto_subcategoria ON catalogo.producto (subcategoria_id);

CREATE TRIGGER tg_producto_actualizado_en
    BEFORE UPDATE ON catalogo.producto
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();
