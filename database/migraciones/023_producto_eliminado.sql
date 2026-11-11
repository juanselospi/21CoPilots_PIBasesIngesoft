-- =====================================================================
-- 023 — producto eliminado que conserva su historial
-- Historia/tarea: HU-03 (SCRUM-77)
-- Justificación: modelo-datos.md § 4, C-28
-- =====================================================================

-- El historial (movimientos de inventario y pedidos ya finalizados o
-- cancelados) ya no impide eliminar un producto. Lo único que lo impide es
-- que esté en un pedido sin finalizar, y eso lo revisa el servidor.
--
-- Un producto sin historial se sigue borrando físicamente. Uno con
-- historial no se puede borrar: inventario.producto_administra es de solo
-- inserción y las líneas de los pedidos viejos lo referencian. Por eso pasa
-- a «eliminado»: desaparece del panel, la tienda y los reportes vigentes,
-- pero sus movimientos y sus ventas se conservan, y su SKU queda reservado.
-- A diferencia de «descontinuado», no se reactiva.
ALTER TABLE catalogo.producto
    DROP CONSTRAINT ck_producto_estado,
    ADD CONSTRAINT ck_producto_estado CHECK (estado IN ('activo', 'descontinuado', 'eliminado'));

-- Las existencias vigentes (alertas y reporte de inventario, RF-45) no
-- incluyen productos eliminados. Mismas columnas que antes.
CREATE OR REPLACE VIEW reportes.v_existencias AS
SELECT p.sku,
       p.nombre,
       p.categoria,
       p.stock,
       p.item,
       COALESCE(p.importacion, f.importacion) AS importacion,
       p.item * (1 + COALESCE(p.importacion, f.importacion) / 100) AS costo_total,
       COALESCE(p.margen_ganancia, f.margen_ganancia) AS margen_ganancia,
       p.importacion IS NULL AS importacion_heredada,
       p.margen_ganancia IS NULL AS margen_heredado,
       p.tasa_impuesto,
       p.contrapedido
  FROM catalogo.producto p
  JOIN catalogo.familia f ON f.nombre = p.categoria
 WHERE p.estado <> 'eliminado';
