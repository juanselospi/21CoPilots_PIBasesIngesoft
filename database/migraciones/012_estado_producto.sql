-- =====================================================================
-- 012 — estado del producto
-- Historia/tarea: SCRUM-90
-- Justificación: modelo-datos.md § 4, C-16
-- =====================================================================

-- Baja lógica (RF-18): un producto descontinuado sale del catálogo pero
-- conserva su historial y se puede reactivar. Distingue "descontinuado" de
-- "agotado" (stock 0), que el sistema no podía diferenciar.
ALTER TABLE catalogo.producto
    ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ADD CONSTRAINT ck_producto_estado CHECK (estado IN ('activo', 'descontinuado'));

CREATE INDEX ix_producto_estado ON catalogo.producto (estado);

-- La eliminación física no necesita nada nuevo: las llaves foráneas de
-- pedidos.agrega e inventario.producto_administra hacia producto son
-- NO ACTION (el valor por defecto), así que la base rechaza borrar un
-- producto con ventas o movimientos, y uno sin historial sí se puede borrar.
