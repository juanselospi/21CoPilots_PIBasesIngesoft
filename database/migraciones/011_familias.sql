-- =====================================================================
-- 011 — familias de productos
-- Historia/tarea: SCRUM-89
-- Justificación: modelo-datos.md § 4, C-15
-- =====================================================================

-- La familia define la importación y el margen de sus productos; un
-- producto los hereda o los sobrescribe (requerimientos-profesor.md § 7).
CREATE TABLE catalogo.familia (
    nombre           VARCHAR(100)   PRIMARY KEY,
    descripcion      TEXT,
    importacion      NUMERIC(6,2)   NOT NULL DEFAULT 0,
    margen_ganancia  NUMERIC(6,2)   NOT NULL DEFAULT 0,
    activa           BOOLEAN        NOT NULL DEFAULT TRUE,

    CONSTRAINT ck_familia_nombre       CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_familia_importacion  CHECK (importacion >= 0),
    CONSTRAINT ck_familia_margen       CHECK (margen_ganancia > -100)
);

-- Una familia por cada categoría que ya existe. Empiezan en 0 % y los
-- productos conservan sus valores propios, así ningún precio cambia.
INSERT INTO catalogo.familia (nombre)
SELECT DISTINCT categoria FROM catalogo.producto;

-- costo_total no puede seguir siendo generada: leería otra tabla. La vista
-- que la usa se reescribe antes de quitarla y calcula los valores efectivos.
DROP VIEW reportes.v_existencias;

ALTER TABLE catalogo.producto
    DROP COLUMN costo_total,
    -- NULL = hereda de la familia; un valor = sobrescribe
    ALTER COLUMN importacion     DROP NOT NULL,
    ALTER COLUMN importacion     DROP DEFAULT,
    ALTER COLUMN margen_ganancia DROP NOT NULL,
    ALTER COLUMN margen_ganancia DROP DEFAULT,
    ADD CONSTRAINT fk_producto_familia
        FOREIGN KEY (categoria) REFERENCES catalogo.familia (nombre) ON UPDATE CASCADE;

CREATE VIEW reportes.v_existencias AS
SELECT p.sku,
       p.nombre,
       p.categoria,
       p.stock,
       p.item,
       coalesce(p.importacion, f.importacion)                          AS importacion,
       p.item * (1 + coalesce(p.importacion, f.importacion) / 100)     AS costo_total,
       coalesce(p.margen_ganancia, f.margen_ganancia)                  AS margen_ganancia,
       p.importacion     IS NULL                                       AS importacion_heredada,
       p.margen_ganancia IS NULL                                       AS margen_heredado,
       p.tasa_impuesto,
       p.contrapedido
FROM   catalogo.producto p
JOIN   catalogo.familia  f ON f.nombre = p.categoria;
